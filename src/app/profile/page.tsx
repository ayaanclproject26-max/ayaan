"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getUserOrders, OrderRecord } from "@/lib/services/orders";
import { CustomerAccountHero } from "@/components/account/CustomerAccountHero";
import { OrderOverviewStrip } from "@/components/account/OrderOverviewStrip";
import { RecentOrdersCard } from "@/components/account/RecentOrdersCard";
import { SavedItemsCard } from "@/components/account/SavedItemsCard";
import { AccountShortcuts } from "@/components/account/AccountShortcuts";

export default function ProfileDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      if (user?.id) {
        setLoading(true);
        try {
          const data = await getUserOrders(user.id);
          if (isMounted) {
            setOrders(data);
          }
        } catch {
          if (isMounted) {
            setOrders([]);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Customer Greeting Hero */}
      <CustomerAccountHero orderCount={loading ? 0 : orders.length} />

      {/* 2. Compact Order Overview Strip */}
      <OrderOverviewStrip orders={orders} loading={loading} />

      {/* 3. Operational Workspace: Recent Orders (primary) + Saved Items (secondary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <RecentOrdersCard orders={orders} loading={loading} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <SavedItemsCard />
        </div>
      </div>

      {/* 4. Useful Account Shortcuts */}
      <AccountShortcuts />
    </div>
  );
}
