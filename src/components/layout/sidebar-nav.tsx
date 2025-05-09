
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Wallet, Lightbulb, Bell, BarChartHorizontalBig } from 'lucide-react'; // Added Bell, BarChartHorizontalBig
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/ai-suggestions', label: 'AI Suggestions', icon: Lightbulb },
  { href: '/notifications', label: 'Notifications', icon: Bell }, 
  { href: '/analytics', label: 'Analytics', icon: BarChartHorizontalBig }, // Added Analytics
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href)}
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

