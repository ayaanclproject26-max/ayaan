import { orderService, OrderRecord, OrderItemRecord, OrderStatusEvent, CreateOrderInput } from "@/services/order.service";

export type { OrderRecord, OrderItemRecord, OrderStatusEvent, CreateOrderInput };

export async function getUserOrders(userId: string | number): Promise<OrderRecord[]> {
  return orderService.getUserOrders(userId);
}

export async function getOrderById(orderId: string, _userId?: string | number): Promise<OrderRecord | null> {
  return orderService.getOrderById(orderId);
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  return orderService.createOrder(input);
}

export async function cancelOrder(orderId: string, userId: string | number, reason?: string): Promise<boolean> {
  return orderService.cancelOrder(orderId, userId, reason);
}

export async function getOrderCommercialDocument(orderId: string, docType: string): Promise<any> {
  return orderService.getOrderCommercialDocument(orderId, docType);
}

export async function getOrderTracking(orderId: string): Promise<any> {
  return orderService.getOrderTracking(orderId);
}

