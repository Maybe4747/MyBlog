import { NavLink } from 'react-router';

const Menu = () => {
  return (
    <div className="relative z-50 w-full flex justify-center font-Alimama text-font-primary font-bold mt-10">
      <nav className="relative flex flex-col justify-center items-center px-6 py-8 font-Alimama border-2 border-font-secondary rounded-2xl w-25 h-12 hover:w-[320px] group transition-all duration-200 hover:duration-300 ease-in">
        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 transform opacity-100 group-hover:opacity-0 group-hover:bottom-0 transition-all duration-300 group-hover:duration-100 ease-in-out">
          Menu
        </div>
        <ul className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center opacity-0 transform group-hover:top-1/2 group-hover:opacity-100 transition-all duration-100 group-hover:duration-300 ease-in-out group-hover:ease-in">
          <li className="px-2">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive ? 'text-highlight underline' : 'hover:underline'
              }>
              Home
            </NavLink>
          </li>
          <li className="px-2">
            <NavLink
              to="/article"
              className={({ isActive }) =>
                isActive ? 'text-highlight underline' : 'hover:underline'
              }>
              Article
            </NavLink>
          </li>
          <li className="px-2">
            <NavLink
              to="/project"
              className={({ isActive }) =>
                isActive ? 'text-highlight underline' : 'hover:underline'
              }>
              Project
            </NavLink>
          </li>
          <li className="px-2">
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? 'text-highlight underline' : 'hover:underline'
              }>
              About
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className='absolute top-0 right-10 w-16 h-16 rounded-full bg-font-secondary '>

      </div>
    </div>
  );
};

export default Menu;
