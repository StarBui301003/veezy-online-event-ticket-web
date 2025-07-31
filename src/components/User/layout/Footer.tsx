import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { LOGO_RECTANGLE } from '@/assets/img';

export const Footer = () => {
  return (
    <footer
      className="bg-[linear-gradient(to_bottom_right,#0B1736,#091D4B,#0B1736)] text-white text-center"
      style={{ background: 'linear-gradient(to bottom right, #0B1736, #091D4B, #0B1736)' }}
    >
      <div className="wrapper mx-16 sm:px-0 pt-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-x-16 items-center text-left mb-6 gap-y-6 ml-20 mt-2">
          <div className="sm:max-w-[320px]">
            <img src={LOGO_RECTANGLE} alt="Logo" className="h-32 mb-3" />
            <p className="text-sm text-white/80">Vezzy – Tap. Book. Rock On.</p>
          </div>
          <div className="text-left text-base text-white/80 max-w-xl">
            <h4 className="text-lg font-semibold mb-5 text-white">Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-1 text-lg text-white" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-sm">
                    600 Nguyen Van Cu Noi Dai Street, Binh Thuy Ward, Can Tho City
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaEnvelope className="mt-1 text-lg text-white" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-sm">support@vezzy.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-white/20 my-2" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-y-6">
          <p className="text-xs text-white/70">© 2025 VEZZY. All rights reserved.</p>

          <div className="flex flex-wrap sm:gap-x-12 gap-x-6 gap-y-4 justify-center text-sm font-medium pr-8">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <Link to="/events" className="hover:underline">
              Event
            </Link>
            <Link to="/news" className="hover:underline">
              News
            </Link>
          </div>

          <div className="flex gap-6 text-xs text-white/70">
            <Link to="/terms-of-use" className="hover:underline">
              Terms of User
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
