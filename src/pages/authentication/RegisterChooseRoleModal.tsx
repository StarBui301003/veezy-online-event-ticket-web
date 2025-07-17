import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { FaUserLarge } from 'react-icons/fa6';
import { FaUserTie } from 'react-icons/fa';

interface RegisterChooseRoleModalProps {
  open: boolean;
  onClose: () => void;
  onChooseRole: (role: number) => void;
}

export const RegisterChooseRoleModal: React.FC<RegisterChooseRoleModalProps> = ({
  open,
  onClose,
  onChooseRole,
}) => {
  const navigate = useNavigate();
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl bg-white shadow-lg pb-8 ">
        <AlertDialogDescription>
          Please choose your role to continue registration. This dialog helps you select between Customer and Event Manager roles before proceeding.
        </AlertDialogDescription>
        {/* Nút back ở góc trên bên trái */}
        <button
          type="button"
          className="absolute top-6 left-6 text-blue-600 hover:text-blue-800 transition-colors bg-transparent z-10"
          onClick={() => navigate('/login')}
          aria-label="Back"
        >
          <IoArrowBack size={28} />
        </button>
        <div className="pb-4 p-8 text-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center my-4 text-gray-600 text-4xl">
              Do you want to be an event manager or a customer?
            </AlertDialogTitle>
          </AlertDialogHeader>
        </div>
        <div className="space-y-2 max-h-[70vh] p-4 flex gap-10 justify-center items-center">
          <div className="flex flex-col items-center">
            <Button
              variant="outline"
              className="w-32 h-32 flex flex-col items-center justify-center border-2 border-gray-200 hover:bg-blue-50 rounded-[10px] shadow-md"
              onClick={() => {
                onChooseRole(1); // Customer
                onClose();
              }}
            >
              <FaUserLarge />
              <span className="font-semibold">Customer</span>
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <Button
              variant="outline"
              className="w-32 h-32 flex flex-col items-center justify-center !mt-0 border-2 border-gray-200 hover:bg-blue-50 rounded-[10px] shadow-md"
              onClick={() => {
                onChooseRole(2); // EventManager
                onClose();
              }}
            >
              <FaUserTie />
              <span className="font-semibold">Event Manager</span>
            </Button>
            {/* Đã xoá nút Login with Face */}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RegisterChooseRoleModal;
