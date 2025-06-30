import Background from "./components/background/index";
import Menu from "/src/components/menu/index";

const Front = () => {
  return (
    <div className="w-full h-screen">
      <Background />
      {/* learning journey */}
      <div className="font-Alibaba font-light w-full text-center text-xl my-16">
        （Explore my learning journey）
      </div>
      <div className="flex justify-center items-center">
        <div className="relative flex flex-col justify-center items-center">
          <img
            src="/public/images/circle_green.webp"
            alt="circle_green"
            className="absolute top-6 left-0 object-cover scale-120"
          />
          <div className="text-9xl font-bold  drop-shadow-md/25 text-center w-fit">
            <span className="text-stroke-2 text-white">Learning</span>{' '}
            <span className="text-font-secondary">—</span>
          </div>
          <div className="text-9xl font-bold drop-shadow-md/25 text-center font-Berkshire text-font-primary w-fit">
            Journey
          </div>
        </div>
      </div>
    </div>
  );
};

export default Front;
