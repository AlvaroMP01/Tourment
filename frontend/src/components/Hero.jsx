import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative bg-animated pattern-overlay min-h-[600px] flex items-center overflow-hidden">
      {/* Geometric shapes background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-valorant-red opacity-10 clip-corner-lg rotate-12 animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-valorant-accent opacity-10 clip-corner rotate-45 animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-valorant-red opacity-5 clip-corner-lg"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-tungsten text-white mb-4 tracking-wider animate-slide-in">
            DEFIENDE
            <span className="block text-valorant-red text-glow">TU GLORIA</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-valorant-light mb-8 max-w-3xl mx-auto animate-fade-in">
            Únete a la plataforma líder de torneos de VALORANT en España.
            Compite, domina y alcanza la cima.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link to="/tournaments" className="btn-valorant">
              Ver Torneos
            </Link>
            <Link
              to="/teams"
              className="btn-valorant bg-transparent border-2 border-valorant-red hover:bg-valorant-red"
            >
              Explorar Equipos
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="card-valorant p-6 text-center">
              <div className="text-4xl font-tungsten text-valorant-red mb-2">16</div>
              <div className="text-sm text-valorant-light uppercase tracking-wider">Torneos Activos</div>
            </div>
            <div className="card-valorant p-6 text-center">
              <div className="text-4xl font-tungsten text-valorant-red mb-2">250+</div>
              <div className="text-sm text-valorant-light uppercase tracking-wider">Equipos</div>
            </div>
            <div className="card-valorant p-6 text-center">
              <div className="text-4xl font-tungsten text-valorant-red mb-2">1.2K+</div>
              <div className="text-sm text-valorant-light uppercase tracking-wider">Jugadores</div>
            </div>
            <div className="card-valorant p-6 text-center">
              <div className="text-4xl font-tungsten text-valorant-red mb-2">€150K</div>
              <div className="text-sm text-valorant-light uppercase tracking-wider">En Premios</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-valorant-dark to-transparent"></div>
    </div>
  );
};

export default Hero;
