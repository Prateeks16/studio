
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Info, LogIn, UserPlus } from 'lucide-react'; // Added LogIn and UserPlus for potential future use
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
  // { href: '/about', label: 'About', icon: Info }, // Example: can be re-added if needed
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href === "/dashboard" && pathname.startsWith("/dashboard")) || (item.href === "/settings" && pathname.startsWith("/settings"))}
              tooltip={{ children: item.label, side: 'right', align: 'center' }}
              asChild={false} 
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

