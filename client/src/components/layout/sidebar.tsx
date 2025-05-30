import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { 
  Car, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Bell, 
  Globe, 
  BarChart3,
  FileText,
  Settings,
  Clock,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Rendez-vous", href: "/appointments", icon: Calendar },
    { name: "Rappels automatiques", href: "/reminders", icon: Bell },
    { name: "Prise de RDV en ligne", href: "/booking", icon: Globe },
    { name: "Statistiques", href: "/statistics", icon: BarChart3 },
    { name: "Rapports et exports", href: "/reports", icon: FileText },
    { name: "Planificateur", href: "/scheduler", icon: Clock },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="bg-primary rounded-lg p-2">
            <Car className="h-5 w-5 text-white" />
          </div>
          <h1 className="ml-3 text-xl font-semibold text-gray-900">TechControl Pro</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    active
                      ? "text-primary-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-primary text-white text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "Utilisateur"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.centerName || "Centre de contrôle technique"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => window.location.href = '/api/logout'}
          >
            Déconnexion
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="text-gray-500 hover:text-gray-600"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="ml-3 flex items-center">
                <div className="bg-primary rounded-lg p-1">
                  <Car className="h-4 w-4 text-white" />
                </div>
                <h1 className="ml-2 text-lg font-semibold text-gray-900">TechControl Pro</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </Button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
