const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/response');

const ORDER_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function parseRange(query) {
  const r = (query?.range || '30d').toString().toLowerCase();
  if (r === '7d' || r === 'week') {
    return { key: '7d', days: 7, granularity: 'day' };
  }
  if (r === '365d' || r === 'year') {
    return { key: '365d', days: 365, granularity: 'month' };
  }
  return { key: '30d', days: 30, granularity: 'day' };
}

function mapRecentOrder(order) {
  const customerName =
    order.customer?.fullName ||
    order.customer?.username ||
    (order.customer?.email ? order.customer.email.split('@')[0] : null) ||
    'Customer';
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customer.id,
    customerName,
    status: order.status,
    total: Math.round(order.totalCents) / 100,
    createdAt: order.createdAt,
  };
}

/**
 * GET /api/tailors/me/dashboard?range=7d|30d|365d
 * Real aggregates for the signed-in tailor (JWT).
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const { key: rangeKey, days, granularity } = parseRange(req.query);

    const profile = await prisma.tailorProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!profile) {
      return sendError(res, 'Tailor profile not found', 404);
    }

    const todayStart = startOfDay(new Date());
    const periodStart = addDays(todayStart, -(days - 1));

    const orders = await prisma.order.findMany({
      where: {
        tailorId: profile.id,
        createdAt: { gte: periodStart },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        stitchingType: true,
        totalCents: true,
        createdAt: true,
        fabricId: true,
        fabric: { select: { id: true, name: true } },
        customer: {
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
    });

    const recentRaw = await prisma.order.findMany({
      where: { tailorId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        stitchingType: true,
        totalCents: true,
        createdAt: true,
        customer: {
          select: { id: true, fullName: true, username: true, email: true },
        },
      },
    });

    const totalOrders = orders.length;
    const countByStatus = (s) => orders.filter((o) => o.status === s).length;
    const pendingOrders = countByStatus('pending');
    const confirmedOrders = countByStatus('confirmed');
    const inProgressOrders = countByStatus('in_progress');
    const completedOrders = countByStatus('completed');
    const cancelledOrders = countByStatus('cancelled');

    const completedCents = orders
      .filter((o) => o.status === 'completed')
      .reduce((acc, o) => acc + o.totalCents, 0);

    const orderStatusDistribution = ORDER_STATUSES.map((status) => {
      const count = countByStatus(status);
      const percentage = totalOrders > 0 ? Math.round((count / totalOrders) * 1000) / 10 : 0;
      return { status, count, percentage };
    });

    const stitchingTypes = ['mens', 'womens', 'childrens'];
    const stitchingBreakdown = stitchingTypes.map((stitchingType) => {
      const count = orders.filter((o) => o.stitchingType === stitchingType).length;
      const percentage = totalOrders > 0 ? Math.round((count / totalOrders) * 1000) / 10 : 0;
      return { stitchingType, count, percentage };
    });

    const fabricMap = new Map();
    for (const o of orders) {
      const fid = o.fabricId || null;
      const name = o.fabric?.name || (fid ? 'Fabric' : 'No fabric');
      const k = fid || '_none';
      const prev = fabricMap.get(k) || { fabricId: fid, name, count: 0 };
      prev.count += 1;
      fabricMap.set(k, prev);
    }
    const fabricList = Array.from(fabricMap.values()).sort((a, b) => b.count - a.count);
    const topFabrics = fabricList.slice(0, 10);
    const fabricBreakdown = topFabrics.map((f) => ({
      fabricId: f.fabricId,
      name: f.name,
      count: f.count,
      percentage: totalOrders > 0 ? Math.round((f.count / totalOrders) * 1000) / 10 : 0,
    }));

    const ordersOverTime = [];
    const earningsOverTime = [];

    if (granularity === 'day') {
      for (let i = days - 1; i >= 0; i -= 1) {
        const dayStart = addDays(todayStart, -i);
        const dayEnd = addDays(dayStart, 1);
        const dayOrders = orders.filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd);
        const orderCount = dayOrders.length;
        const earnCents = dayOrders
          .filter((o) => o.status === 'completed')
          .reduce((a, o) => a + o.totalCents, 0);
        const label =
          days <= 7
            ? dayStart.toLocaleDateString('en-US', { weekday: 'short' })
            : `${dayStart.getMonth() + 1}/${dayStart.getDate()}`;
        const dateKey = dayStart.toISOString().slice(0, 10);
        ordersOverTime.push({ date: dateKey, label, value: orderCount });
        earningsOverTime.push({
          date: dateKey,
          label,
          value: Math.round(earnCents) / 100,
        });
      }
    } else {
      for (let i = 11; i >= 0; i -= 1) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        monthStart.setMonth(monthStart.getMonth() - i);
        const monthEnd = addMonths(monthStart, 1);
        const monthOrders = orders.filter((o) => o.createdAt >= monthStart && o.createdAt < monthEnd);
        const orderCount = monthOrders.length;
        const earnCents = monthOrders
          .filter((o) => o.status === 'completed')
          .reduce((a, o) => a + o.totalCents, 0);
        const label = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const dateKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
        ordersOverTime.push({ date: dateKey, label, value: orderCount });
        earningsOverTime.push({
          date: dateKey,
          label,
          value: Math.round(earnCents) / 100,
        });
      }
    }

    const [allTimeOrderCount, allTimeEarningsAgg] = await Promise.all([
      prisma.order.count({ where: { tailorId: profile.id } }),
      prisma.order.aggregate({
        where: { tailorId: profile.id, status: 'completed' },
        _sum: { totalCents: true },
      }),
    ]);
    const allTimeEarnings = Math.round(allTimeEarningsAgg._sum.totalCents || 0) / 100;

    return sendSuccess(res, 'OK', {
      range: rangeKey,
      rangeFrom: periodStart.toISOString(),
      rangeDays: days,
      granularity,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        inProgressOrders,
        completedOrders,
        cancelledOrders,
        totalEarnings: Math.round(completedCents) / 100,
        allTimeOrderCount,
        allTimeEarnings,
      },
      recentOrders: recentRaw.map(mapRecentOrder),
      chartData: {
        ordersOverTime,
        earningsOverTime,
        orderStatusDistribution,
        stitchingBreakdown,
        fabricBreakdown,
      },
    });
  } catch (e) {
    console.error('getDashboardAnalytics', e);
    return sendError(res, e.message || 'Failed to load dashboard', 500);
  }
};

module.exports = { getDashboardAnalytics };
