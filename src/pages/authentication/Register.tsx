import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { AiOutlineCalendar } from 'react-icons/ai';
import { Eye, EyeOff } from "lucide-react";

export const Register = () => {
  const [date, setDate] = useState<Date>();
  const [showPassword, setShowPassword] = useState(false);
  //   const [username, setUsername] = useState('');
  //   const [password, setPassword] = useState('');
  //   const [fullname, setFullname] = useState('');
  //   const [email, setEmail] = useState('');
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,_#091D4B_50%,_#0B1736_50%)] min-h-screen w-full" />
      <div className="min-h-screen text-white flex relative">
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="text-[38px] text-bold pb-6">Create Your Veezy Account</div>
            <div className="mt-6 flex flex-col gap-4 items-center">
              <div className="w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Username"
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                />
              </div>
              <div className=" mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Fullname"
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                />
              </div>
              <div className=" mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <Input
                  type="text"
                  placeholder="Email"
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3"
                />
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px] relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3 pr-12"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              <div className="mt-4 w-[380px] text-[#A1A1AA] text-[24px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative w-full">
                      <Input
                        readOnly
                        value={date ? format(date, 'dd/MM/yyyy') : ''}
                        placeholder="Day of Birth"
                        className="rounded-[8px] border-none focus:outline-none bg-white/5 text-[#A1A1AA] shadow-[0_4px_4px_rgba(0,0,0,0.25)] py-6 px-3 pr-12 text-left cursor-pointer"
                      />
                      <AiOutlineCalendar
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] pointer-events-none"
                        size={24}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    sideOffset={30}
                    className="w-auto p-0 bg-white text-black rounded-md shadow-md"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      classNames={{
                        day_selected: 'bg-blue-500 text-white hover:bg-blue-600',
                        day_today: 'bg-blue-300 text-white',
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white px-6 w-[380px] rounded-[8px] py-6 text-[20px] mt-[46px]">
              Sign Up
            </Button>

            <div className="mt-6 text-start">
              Already have an account?{' '}
              <Link to="/login" className="text-[#60A5FA] hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1"></div>
      </div>
    </>
  );
};
