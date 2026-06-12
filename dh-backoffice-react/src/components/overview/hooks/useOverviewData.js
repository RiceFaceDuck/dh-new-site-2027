import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { billingService } from '../../../firebase/billingService';
import { todoService } from '../../../firebase/todoService';

export const useOverviewData = () => {
  const [orders, setOrders] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gamification Target
  const DAILY_TARGET = 50000;

  useEffect(() => {
    // 🔥 Optimization: Only subscribe to TODAY's orders to save massive Firebase reads.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unsubOrders = billingService.subscribeRecentOrders(100, { start: today }, (data) => {
      setOrders(data);
    });

    const unsubTodos = todoService.subscribePendingTodos((data) => {
      setTodos(data);
    });

    // Simulate network delay for UI polish
    const timer = setTimeout(() => setLoading(false), 800);

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubTodos) unsubTodos();
      clearTimeout(timer);
    };
  }, []);

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return orderDate >= today;
    });

    const paidToday = todayOrders.filter(o => o.paymentStatus === 'Paid');
    const revenueToday = paidToday.reduce((sum, o) => sum + (o.netTotal || 0), 0);
    const conversionRate = todayOrders.length > 0 ? ((paidToday.length / todayOrders.length) * 100).toFixed(0) : 0;
    const aov = paidToday.length > 0 ? (revenueToday / paidToday.length) : 0;

    const pendingShipments = orders.filter(o => 
      (o.orderStatus === 'Paid' || o.orderStatus === 'Pending') && 
      o.fulfillmentType !== 'StorePickup' && 
      !o.trackingNo 
    ).length;

    const criticalClaims = todos.filter(t => t.type?.includes('CLAIM') || t.type?.includes('RETURN')).length;
    const pendingStaff = todos.filter(t => t.type === 'STAFF_APPROVAL').length;

    // Mock new metrics for "ปริมาณจำนวนออเดอร์ วันนี้" and "การเข้าชมเว็บไซค์"
    const websiteViews = 2450;
    const pageViews = 8900;
    const pendingTasks = todos.length;

    return {
      revenueToday,
      ordersToday: todayOrders.length,
      conversionRate,
      aov,
      pendingShipments,
      criticalClaims,
      pendingStaff,
      websiteViews,
      pageViews,
      pendingTasks
    };
  }, [orders, todos]);

  const progressPercent = Math.min((metrics.revenueToday / DAILY_TARGET) * 100, 100);

  return {
    metrics,
    loading,
    DAILY_TARGET,
    progressPercent
  };
};
