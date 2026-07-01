require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD = 'Password@123';

async function upsertUsers() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tailorconnect.com' },
    update: {
      fullName: 'System Admin',
      role: 'admin',
      status: 'active',
      passwordHash
    },
    create: {
      email: 'admin@tailorconnect.com',
      username: 'admin',
      passwordHash,
      role: 'admin',
      status: 'active',
      fullName: 'System Admin'
    }
  });

  const tailorUser = await prisma.user.upsert({
    where: { email: 'tailor1@tailorconnect.com' },
    update: {
      fullName: 'Ayan Tailors',
      role: 'tailor',
      status: 'active',
      passwordHash
    },
    create: {
      email: 'tailor1@tailorconnect.com',
      username: 'tailor1',
      passwordHash,
      role: 'tailor',
      status: 'active',
      fullName: 'Ayan Tailors',
      phone: '+923001112233'
    }
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer1@tailorconnect.com' },
    update: {
      fullName: 'Demo Customer',
      role: 'customer',
      status: 'active',
      passwordHash
    },
    create: {
      email: 'customer1@tailorconnect.com',
      username: 'customer1',
      passwordHash,
      role: 'customer',
      status: 'active',
      fullName: 'Demo Customer',
      phone: '+923009998877'
    }
  });

  return { admin, tailorUser, customerUser };
}

async function upsertProfiles({ admin, tailorUser, customerUser }) {
  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id }
  });

  const tailorProfile = await prisma.tailorProfile.upsert({
    where: { userId: tailorUser.id },
    update: {
      businessName: 'Ayan Premium Tailors',
      location: 'Karachi',
      description: 'Custom men and women stitching with home visit option.',
      yearsOfExperience: 8,
      specializations: ["Men's Wear", "Women's Wear", 'Formal'],
      averageRating: 4.5,
      totalReviews: 128,
      isAvailable: true,
      availabilityStatus: 'available'
    },
    create: {
      userId: tailorUser.id,
      businessName: 'Ayan Premium Tailors',
      location: 'Karachi',
      description: 'Custom men and women stitching with home visit option.',
      yearsOfExperience: 8,
      specializations: ["Men's Wear", "Women's Wear", 'Formal'],
      averageRating: 4.5,
      totalReviews: 128,
      isAvailable: true,
      availabilityStatus: 'available'
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {
      address: 'Street 10, DHA',
      city: 'Karachi',
      state: 'Sindh',
      postalCode: '75500'
    },
    create: {
      userId: customerUser.id,
      address: 'Street 10, DHA',
      city: 'Karachi',
      state: 'Sindh',
      postalCode: '75500'
    }
  });

  return { tailorProfile };
}

async function upsertCatalog(tailorProfile) {
  const fabricsData = [
    {
      name: 'Premium Cotton',
      priceCents: 3500,
      description: 'Soft breathable cotton for daily wear.',
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    },
    {
      name: 'Lawn Deluxe',
      priceCents: 4200,
      description: 'Lightweight lawn ideal for summer dresses.',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
    },
    {
      name: 'Formal Wash & Wear',
      priceCents: 5000,
      description: 'Elegant formal fabric for events.',
      imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10'
    }
  ];

  const fabrics = [];
  for (const item of fabricsData) {
    const fabric = await prisma.fabric.upsert({
      where: {
        id: `${tailorProfile.id}-${item.name}`.toLowerCase().replace(/\s+/g, '-')
      },
      update: {
        name: item.name,
        priceCents: item.priceCents,
        description: item.description,
        imageUrl: item.imageUrl,
        isActive: true
      },
      create: {
        id: `${tailorProfile.id}-${item.name}`.toLowerCase().replace(/\s+/g, '-'),
        tailorId: tailorProfile.id,
        name: item.name,
        priceCents: item.priceCents,
        description: item.description,
        imageUrl: item.imageUrl,
        isActive: true
      }
    });
    fabrics.push(fabric);
  }

  const portfolioData = [
    {
      idSuffix: 'bridal-gown',
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8',
      description: 'Custom bridal gown stitching.'
    },
    {
      idSuffix: 'formal-suit',
      imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22',
      description: 'Three-piece formal suit with custom fit.'
    }
  ];

  for (const item of portfolioData) {
    await prisma.portfolioItem.upsert({
      where: { id: `${tailorProfile.id}-${item.idSuffix}` },
      update: {
        imageUrl: item.imageUrl,
        description: item.description
      },
      create: {
        id: `${tailorProfile.id}-${item.idSuffix}`,
        tailorId: tailorProfile.id,
        imageUrl: item.imageUrl,
        description: item.description
      }
    });
  }

  return fabrics[0];
}

async function upsertOrderFlow({ customerUser, tailorProfile, fabric }) {
  const order = await prisma.order.upsert({
    where: { orderNumber: 'TC-1001' },
    update: {
      status: 'in_progress',
      deliveryAddress: 'House 12, DHA Phase 6, Karachi',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      specialInstructions: 'Slim fit with extra sleeve margin.',
      isExpress: true,
      fabricPriceCents: fabric.priceCents,
      expressFeeCents: 1000,
      totalCents: fabric.priceCents + 1000
    },
    create: {
      orderNumber: 'TC-1001',
      customerId: customerUser.id,
      tailorId: tailorProfile.id,
      fabricId: fabric.id,
      stitchingType: 'mens',
      status: 'in_progress',
      deliveryAddress: 'House 12, DHA Phase 6, Karachi',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      specialInstructions: 'Slim fit with extra sleeve margin.',
      isExpress: true,
      fabricPriceCents: fabric.priceCents,
      expressFeeCents: 1000,
      totalCents: fabric.priceCents + 1000
    }
  });

  await prisma.orderMeasurement.upsert({
    where: { orderId: order.id },
    update: {
      unit: 'cm',
      measurementsJson: {
        chest: 40,
        waist: 34,
        shoulder: 18,
        sleeveLength: 24,
        shirtLength: 30,
        pantLength: 40
      }
    },
    create: {
      orderId: order.id,
      unit: 'cm',
      measurementsJson: {
        chest: 40,
        waist: 34,
        shoulder: 18,
        sleeveLength: 24,
        shirtLength: 30,
        pantLength: 40
      }
    }
  });

  const statuses = ['pending', 'confirmed', 'in_progress'];
  for (const status of statuses) {
    const exists = await prisma.orderStatusHistory.findFirst({
      where: { orderId: order.id, status }
    });
    if (!exists) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status,
          note: `Order moved to ${status}`
        }
      });
    }
  }

  return order;
}

async function upsertChatAndNotifications({ customerUser, tailorUser, order }) {
  const conversation = await prisma.conversation.upsert({
    where: { id: `conv-${order.id}` },
    update: {
      orderId: order.id
    },
    create: {
      id: `conv-${order.id}`,
      orderId: order.id
    }
  });

  for (const userId of [customerUser.id, tailorUser.id]) {
    await prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId
        }
      },
      update: {},
      create: {
        conversationId: conversation.id,
        userId
      }
    });
  }

  const seedMessages = [
    {
      id: `msg-${order.id}-1`,
      senderId: customerUser.id,
      content: 'Hi, can you confirm the delivery timeline?',
      type: 'text'
    },
    {
      id: `msg-${order.id}-2`,
      senderId: tailorUser.id,
      content: 'Yes, it will be ready within 7 days.',
      type: 'text'
    }
  ];

  for (const msg of seedMessages) {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: {
        content: msg.content,
        type: msg.type
      },
      create: {
        id: msg.id,
        conversationId: conversation.id,
        senderId: msg.senderId,
        orderId: order.id,
        type: msg.type,
        content: msg.content
      }
    });
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() }
  });

  const notifications = [
    {
      id: `notif-order-${order.id}-customer`,
      userId: customerUser.id,
      actorId: tailorUser.id,
      type: 'order_status_changed',
      title: 'Order update',
      body: 'Your order TC-1001 is now in progress.'
    },
    {
      id: `notif-order-${order.id}-tailor`,
      userId: tailorUser.id,
      actorId: customerUser.id,
      type: 'new_message',
      title: 'New customer message',
      body: 'You received a message about order TC-1001.'
    }
  ];

  for (const item of notifications) {
    await prisma.notification.upsert({
      where: { id: item.id },
      update: {
        title: item.title,
        body: item.body
      },
      create: {
        id: item.id,
        userId: item.userId,
        actorId: item.actorId,
        type: item.type,
        title: item.title,
        body: item.body
      }
    });
  }
}

async function seed() {
  console.log('🌱 Seeding started...');

  const users = await upsertUsers();
  const { tailorProfile } = await upsertProfiles(users);
  const primaryFabric = await upsertCatalog(tailorProfile);
  const order = await upsertOrderFlow({
    customerUser: users.customerUser,
    tailorProfile,
    fabric: primaryFabric
  });
  await upsertChatAndNotifications({
    customerUser: users.customerUser,
    tailorUser: users.tailorUser,
    order
  });

  console.log('✅ Seeding completed.');
  console.log('Test users password:', PASSWORD);
  console.log('Admin: admin@tailorconnect.com');
  console.log('Tailor: tailor1@tailorconnect.com');
  console.log('Customer: customer1@tailorconnect.com');
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
