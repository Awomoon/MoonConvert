import AnimatedBackground from "./components/AnimatedBackground";
import ConverterCard from "./components/ConverterCard";

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-8">
      <AnimatedBackground />

      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Universal File Converter
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-6">
              Transform files effortlessly with Moon-Convert
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto" />
          </div>
        </header>

        <ConverterCard />

        <footer className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            Made with ❤️ by Moontech • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
