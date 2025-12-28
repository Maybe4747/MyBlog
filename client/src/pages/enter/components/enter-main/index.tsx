import { NavLink } from 'react-router';

const EnterMain = () => {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center text-shadow-sm/15 text-font-primary font-bold">
      {/* welcome */}
      <div className="-translate-x-20">
        <img
          className="absolute scale-150 translate-x-52"
          src="/public/images/circle_green.webp"
          alt="circle_green"
        />
        <h1 className="translate-y-1/3 text-8xl font-primary">Welcome </h1>
        <div className="w-full flex justify-end">
          <svg
            className="translate-x-full -translate-y-1/4 "
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            width="103.6651611328125"
            height="98.59142303466797"
            viewBox="0 0 103.6651611328125 98.59142303466797"
            fill="none">
            <path
              d="M103.665 37.6586L64.0056 37.7453L51.8326 0L39.6595 37.7453L4.76837e-07 37.6586L32.1362 60.8997L19.7983 98.5914L51.8326 75.21L83.8669 98.5914L71.529 60.8997L103.665 37.6586Z"
              fill="#7AF4FF"></path>
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-16 translate-x-25 -translate-y-4">
        <h3 className="text-7xl">To</h3>
        <h1 className="text-9xl text-shadow-none drop-shadow-sm/15 text-stroke text-transparent bg-clip-text bg-radial-[ellipse_at_50%_50%] from-font-primary to-white to-70%">
          MYBLOG
        </h1>
      </div>
      <NavLink to="/home">
        <button className="px-6 py-2 border-1 border-font-secondary rounded-2xl shadow-md text-3xl mt-10 font-Anonymous cursor-pointer">
          <p className="bg-clip-text text-transparent bg-radial from-[#7AF4FF] to-font-primary">
            enter
          </p>
        </button>
      </NavLink>
      <div className="fixed bottom-24 right-24 h-60 w-60 bg-[#7AF4FF] blur-[60px] rounded-full"></div>
    </div>
  );
};
export default EnterMain;
