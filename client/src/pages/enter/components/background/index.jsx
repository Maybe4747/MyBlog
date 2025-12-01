const BackGround = () => {
  return (
    <div className="absolute h-screen">
      <div className="h-[430px] w-[430px] bg-[#13f8fb] blur-3xl rounded-full"></div>
    
      <img className="fixed bottom-0 left-1/4 translate-y-1/2 opacity-20 scale-150" src='/public/images/circle_font.webp' alt="circle_font"></img>
      <img className="fixed top-0 right-0 -translate-y-1/3 translate-x-1/4 opacity-20" src='/public/images/circle_font.webp' alt="circle_font"></img>
      <div className="fixed top-20 right-72 w-40 h-40 rounded-full border-1 border-font-primary"/>
    </div>
  );
}
export default BackGround;