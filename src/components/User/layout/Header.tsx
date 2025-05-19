import { CiSearch } from 'react-icons/ci';
import { Button } from '../../ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { AVATAR, LOGO } from '@/assets/img';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { IoIosArrowDown } from 'react-icons/io';
import { Input } from '../../ui/input';
import { LogoutAPI } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';
import { Account } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Header = () => {
  const [blur, setBlur] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.addEventListener('scroll', changeBlur);
    const accStr = localStorage.getItem('account');
    if (accStr) {
      try {
        const acc = JSON.parse(accStr);
        setAccount(acc);
      } catch {
        // Failed to parse account from localStorage
      }
    }
    return () => {
      window.removeEventListener('scroll', changeBlur);
    };
  }, []);

  const changeBlur = () => {
    setBlur(window.scrollY > 0);
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await LogoutAPI();
      localStorage.removeItem('access_token');
      localStorage.removeItem('account');
      document.cookie = 'refresh_token=; Max-Age=0; path=/;';
      setAccount(null);
      navigate('/login');
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <>
      <div
        className={cn('fixed top-0 w-full pl-[10px] sm:pl-0 pr-[14px] sm:pr-0 items-center z-20', {
          'backdrop-blur': blur,
        })}
      >
        <div className="sm:wrapper flex sm:h-[100px] h-[57px] items-center justify-between px-7 pr-10">
          <div></div>
          {/* Logo */}
          <Link to={'/'} className="block shrink-0">
            <img className="sm:h-10 sm:w-[115px] w-[92px] h-[32px]" src={LOGO} alt="Logo" />
          </Link>
          {/* Navigation */}
          <div className="sm:flex sm:gap-x-12 hidden">
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Home
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Category
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Shows
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              About
            </Link>
            <Link
              to="/"
              className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
            >
              Contact
            </Link>
          </div>
          {/* desktop search bar */}
          <div className="flex w-full max-w-sm items-center min-w-70 border bg-white rounded-[46px] ml-16">
            <CiSearch className="size-5 text-neutral-60 ml-[17px]" strokeWidth={1.2} />
            <Input
              type="text"
              placeholder="Search something here!"
              className="body-medium-14 border-none truncate-placeholder ml-0 my-[2px] text-neutral-40 shadow-none"
            />
          </div>

          <div className="mr-14">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="body-medium-16 px-[6px] hidden sm:flex bg-transparent"
                >
                  EN
                  <IoIosArrowDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-x-6 ml-0">
            {!account ? (
              <>
                <Link
                  to="/login"
                  className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="body-bold-16 text-dark-blue-primary border-b border-b-transparent hover:border-neutral-100 transition-colors select-none"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 bg-transparent"
                    style={{ minWidth: 0 }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={account.avatar || AVATAR} alt="avatar" />
                      <AvatarFallback>
                        {account.fullname?.[0]?.toUpperCase() ||
                          account.username?.[0]?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline whitespace-nowrap">
                      Welcome,{' '}
                      <b>{account.fullname?.trim() ? account.fullname : account.username}</b>!
                    </span>
                    <IoIosArrowDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white text-black">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={loadingLogout}>
                    {loadingLogout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
