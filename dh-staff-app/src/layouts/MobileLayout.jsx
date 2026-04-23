
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ClipboardList, Package, History, UserCircle, Bell } from 'lucide-react';

const MobileLayout = () => {

const location = useLocation();

const navItems = [
{ label: 'งานแพ็ค', path: '/', icon: <ClipboardList size={24} /> },
{ label: 'คลังสินค้า', path: '/stock', icon: <Package size={24} /> },
{ label: 'ประวัติ', path: '/history', icon: <History size={24} /> },
{ label: 'โปรไฟล์', path: '/profile', icon: <UserCircle size={24} /> },
];

return (
<div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl relative overflow-hidden">

<header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-5 sticky top-0 z-50">
<div className="flex items-center gap-2">
<div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">DH</div>
<span className="font-bold text-gray-800 tracking-tight">STAFF APP</span>
</div>

<button className="relative p-2 text-gray-400">
<Bell size={20} />
<span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
</button>
</header>

<main className="flex-1 overflow-y-auto pb-24">
<Outlet />
</main>

<nav className="h-20 bg-white border-t border-gray-100 flex items-center justify-around px-2 fixed bottom-0 w-full max-w-md">
{navItems.map((item) => {
const isActive = location.pathname === item.path;
return (
<Link
key={item.path}
to={item.path}
className={`flex flex-col items-center justify-center gap-1 ${
isActive ? 'text-green-600 scale-110 font-bold' : 'text-gray-400'
}`}
>
{item.icon}
<span className="text-[10px]">{item.label}</span>
</Link>
);
})}
</nav>

</div>
);
};

export default MobileLayout;
