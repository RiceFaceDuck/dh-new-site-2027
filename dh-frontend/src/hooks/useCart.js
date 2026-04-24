import { useContext } from "react";
import { CartContext } from "../context/CartContext"; // [UPDATE] แก้ไขชื่อโฟลเดอร์จาก contexts เป็น context

export const useCart = () => useContext(CartContext);