import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, User, Menu, MapPin, 
  MessageCircle, ChevronRight, Star, ShieldCheck, 
  X, Monitor, Keyboard, Battery, Wrench, CheckCircle2, Truck, Trash2, ShoppingBag
} from 'lucide-react';

// ============================================================================
// 📁 MOCK DATA (จำลองฐานข้อมูล)
// ============================================================================
const PRODUCTS_DATA = [
  { id: 'p1', title: "หน้าจอ IPS 15.6 144Hz 40Pin (ไม่มีหู) ขอบบาง", sku: "SC-156-144", price: 1850, category: "หน้าจอ", rating: 5.0, sold: 1240, imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80" },
  { id: 'p2', title: "คีย์บอร์ด Acer Nitro 5 AN515-51 มีไฟ Backlight", sku: "KB-AC-001", price: 590, category: "คีย์บอร์ด", rating: 4.8, sold: 856, imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=400&q=80" },
  { id: 'p3', title: "แบตเตอรี่แท้ Asus TUF Gaming FX505 FX505DT", sku: "BT-AS-092", price: 1200, category: "แบตเตอรี่", rating: 4.9, sold: 430, imageUrl: "https://images.unsplash.com/photo-1601524909162-ae8725290836?auto=format&fit=crop&w=400&q=80" },
  { id: 'p4', title: "บานพับ L/R Lenovo IdeaPad 3 15ADA05 แท้", sku: "HG-LN-033", price: 450, category: "สายแพร/บานพับ", rating: 4.7, sold: 215, imageUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=400&q=80" },
  { id: 'p5', title: "พัดลมระบายความร้อน HP Pavilion 15-EG CPU Fan", sku: "FN-HP-012", price: 390, category: "พัดลม", rating: 4.6, sold: 342, imageUrl: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=400&q=80" }
];