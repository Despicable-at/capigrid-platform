import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Menu, Plus, BarChart3, Settings, LogOut, User, Home } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/campaigns?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navigationItems = [
    { label: "Explore", href: "/campaigns" },
    { label: "Start Campaign", href: "/create-campaign" },
    { label: "How it Works", href: "#" },
    { label: "About", href: "#" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <a href="/" className="text-2xl font-bold text-primary">
                CapiGrid
              </a>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navigationItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`text-neutral-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors ${
                      window.location.pathname === item.href ? "text-primary" : ""
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Search and Auth */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {showSearch ? (
              <form onSubmit={handleSearch} className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                    autoFocus
                    onBlur={() => setShowSearch(false)}
                  />
                </div>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(true)}
                className="text-neutral-600 hover:text-primary"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* Authentication */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/create-campaign"}
                  className="hidden sm:flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = "/"}>
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = "/dashboard"}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = "/create-campaign"}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => window.location.href = "/admin"}>
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  className="text-neutral-600 hover:text-primary"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </form>

                  {/* Mobile Navigation */}
                  <div className="flex flex-col space-y-2">
                    {navigationItems.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        className="text-neutral-600 hover:text-primary px-3 py-2 text-sm font-medium transition-colors block"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>

                  {/* Mobile Auth */}
                  {isAuthenticated && user ? (
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex items-center space-x-3 px-3 py-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <a
                        href="/dashboard"
                        className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-primary"
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                      </a>
                      <a
                        href="/create-campaign"
                        className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-primary"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Campaign
                      </a>
                      {user.role === "admin" && (
                        <a
                          href="/admin"
                          className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-primary"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </a>
                      )}
                      <a
                        href="/api/logout"
                        className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-primary"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </a>
                    </div>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.location.href = "/api/login"}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Log In
                      </Button>
                      <Button
                        className="w-full justify-start"
                        onClick={() => window.location.href = "/api/login"}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
