# Tailor Flow – Implementation Status

**Legend:** Done | In progress | Not started

---

## Screens

| Screen | Route / File | Status | Notes |
|--------|--------------|--------|--------|
| Index (splash) | `app/index.tsx` | Done | Auth check, role redirect |
| Login | `app/(auth)/login.tsx` | Done | |
| Register | `app/(auth)/register.tsx` | Done | |
| Dashboard (tab) | `app/(tailor)/(tabs)/dashboard.tsx` | Done | |
| **Orders (tab)** | `app/(tailor)/(tabs)/orders.tsx` | **Done** | Dummy data; filter tabs; nav to order-detail |
| Order detail | `app/(tailor)/order-detail.tsx` | Done | Dummy data; back to Orders |
| **Chat (tab)** | `app/(tailor)/(tabs)/chat.tsx` | **Done** | Dummy data; nav to chat detail |
| **Chat detail** | `app/(tailor)/chat/[id].tsx` | **Done** | Dummy data; mocked GET messages & send; WhatsApp-style UI |
| Notifications (tab) | `app/(tailor)/(tabs)/notifications.tsx` | **Done** | Dummy data; date groups; Mark All Read; tap navigates |
| Profile (tab) | `app/(tailor)/(tabs)/profile.tsx` | Done | |
| Profile edit | `app/(tailor)/profile-edit.tsx` | Done | |
| Portfolio management | `app/(tailor)/portfolio-management.tsx` | Done | |
| Fabric management | `app/(tailor)/fabric-management.tsx` | Done | |
| Home visit requests | `app/(tailor)/home-visit-requests.tsx` | Not started | |
| Settings | `app/(tailor)/settings.tsx` | Not started | |
| Help | `app/(tailor)/help.tsx` | Not started | |
| About | `app/(tailor)/about.tsx` | Not started | |

---

## Navigation checklist

- [x] Orders tab → Order detail (by order id)
- [x] Order detail → Back to Orders
- [x] Dashboard recent order → Order detail
- [ ] Profile → Settings, Help, About, Home visit requests
- [x] Chat tab → Chat detail
- [x] Dashboard → (existing links)

---

## Next

**Implement Settings:** Create `(tailor)/settings.tsx`, add to layout, link from Profile.
