import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockTournaments } from '../data/mockData';
import Modal from './Modal';

const EventCalendar = () => {
  const [selectedTournamentId, setSelectedTournamentId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredTournaments = useMemo(() => {
    let result = mockTournaments;
    
    if (selectedTournamentId !== 'all') {
      result = result.filter(t => String(t.id) === selectedTournamentId);
    }
    
    if (selectedStatus !== 'all') {
      result = result.filter(t => t.status === selectedStatus);
    }
    
    return result;
  }, [selectedTournamentId, selectedStatus]);

  useEffect(() => {
    if (selectedTournamentId !== 'all') {
      const selected = mockTournaments.find(t => String(t.id) === selectedTournamentId);
      if (selected && selected.startDate) {
        const startDate = new Date(selected.startDate);
        setCurrentDate(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
      }
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    if (selectedTournamentId !== 'all' && selectedStatus !== 'all') {
      const selected = mockTournaments.find(t => String(t.id) === selectedTournamentId);
      if (selected && selected.status !== selectedStatus) {
        setSelectedTournamentId('all');
      }
    }
  }, [selectedStatus, selectedTournamentId]);

  // Find the earliest non-completed tournament, or fallback to today
  const defaultDate = useMemo(() => {
    if (mockTournaments.length === 0) return new Date();
    const activeOrFuture = mockTournaments.filter(t => t.status !== 'completed');
    if (activeOrFuture.length > 0) {
      activeOrFuture.sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
      return new Date(activeOrFuture[0].startDate);
    }
    return new Date();
  }, []);

  const [currentDate, setCurrentDate] = useState(defaultDate);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Funciones de navegación
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Cálculo de los días a mostrar
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Día de la semana que empieza el mes (0=Domingo, 1=Lunes...) -> Ajustado a 0=Lunes
  let startDay = startOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6; // Domingo

  const daysInMonth = endOfMonth.getDate();

  // Helper para verificar si hay eventos ese día
  // Asumimos que un torneo está activo cualquier día desde startDate hasta endDate
  const getEventsForDate = (year, month, day) => {
    const targetDate = new Date(year, month, day);
    // Remove time for comparison
    targetDate.setHours(0, 0, 0, 0);

    return filteredTournaments.filter(t => {
      const start = new Date(t.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(t.endDate);
      end.setHours(23,59,59,999);
      
      return targetDate >= start && targetDate <= end;
    });
  };

  const handleDayClick = (day) => {
    const events = getEventsForDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (events.length > 0) {
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      setIsModalOpen(true);
    }
  };

  const daysArray = [];
  // Espacios vacíos antes del primer día
  for (let i = 0; i < startDay; i++) {
    daysArray.push(null);
  }
  // Los días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  // Eventos para el día seleccionado
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'text-valorant-red border-valorant-red';
      case 'upcoming':
        return 'text-valorant-gold border-valorant-gold';
      case 'completed':
        return 'text-valorant-light border-valorant-light';
      default:
        return 'text-valorant-light border-valorant-light';
    }
  };

  return (
    <div className="bg-valorant-dark-secondary p-6 clip-corner-sm">
      {/* Header del Calendario */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 text-valorant-light hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-3xl font-tungsten text-white uppercase tracking-wider">
          {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-2 text-valorant-light hover:text-white transition-colors">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select 
          className="w-full bg-valorant-dark border border-valorant-red/30 text-white p-2 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
        >
          <option value="all">Todos los torneos</option>
          {mockTournaments
            .filter(t => selectedStatus === 'all' || t.status === selectedStatus)
            .map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        
        <select 
          className="w-full bg-valorant-dark border border-valorant-red/30 text-white p-2 font-bold uppercase focus:border-valorant-red focus:outline-none transition-colors"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="live">En Vivo</option>
          <option value="upcoming">Próximamente</option>
          <option value="completed">Finalizados</option>
        </select>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, ix) => (
          <div key={ix} className="text-center text-xs font-bold text-valorant-light uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Cuadrícula de Días */}
      <div className="grid grid-cols-7 gap-1">
        {daysArray.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-14"></div>;
          
          const events = getEventsForDate(currentDate.getFullYear(), currentDate.getMonth(), day);
          const hasEvents = events.length > 0;
          
          // Estilo si hay eventos
          const activeClasses = hasEvents 
            ? "cursor-pointer bg-valorant-dark border border-valorant-red/30 hover:border-valorant-red hover:bg-valorant-red/10 group" 
            : "text-valorant-light/50";
            
          return (
            <div 
              key={day} 
              onClick={() => handleDayClick(day)}
              className={`h-14 flex flex-col justify-between p-1 transition-all ${activeClasses}`}
            >
              <span className={`text-sm font-bold ${hasEvents ? 'text-white' : ''}`}>{day}</span>
              {hasEvents && (
                <div className="flex gap-1 mt-auto">
                  {events.slice(0, 3).map((e, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${e.status === 'live' ? 'bg-valorant-red' : e.status === 'upcoming' ? 'bg-valorant-gold' : 'bg-valorant-light'} group-hover:scale-150 transition-transform`}></div>
                  ))}
                  {events.length > 3 && <span className="text-[8px] text-white leading-none ml-1">+{events.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de eventos del día seleccionado */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Eventos - ${selectedDate?.toLocaleDateString('es-ES')}`}
      >
        <div className="flex flex-col gap-4 mt-4">
          {selectedEvents.length > 0 ? (
             selectedEvents.map(event => (
               <div key={event.id} className="bg-valorant-dark border-l-4 p-4 hover:bg-valorant-dark/80 transition-colors" style={{ borderLeftColor: event.status === 'live' ? '#ff4655' : event.status === 'upcoming' ? '#ffc107' : '#ece8e1' }}>
                 <div className="flex justify-between items-start mb-2">
                   <div>
                      <h4 className="text-xl font-bold text-white uppercase">{event.name}</h4>
                      <p className="text-xs text-valorant-light uppercase">{event.region}</p>
                   </div>
                   <span className={`text-xs font-bold uppercase border px-2 py-1 ${getStatusColor(event.status)}`}>
                      {event.status === 'live' ? 'En Vivo' : event.status === 'upcoming' ? 'Próximamente' : 'Finalizado'}
                   </span>
                 </div>
                 <div className="text-sm text-valorant-light mb-4">
                    {event.description}
                 </div>
                 <Link 
                    to={`/tournaments/${event.id}`} 
                    className="inline-block bg-valorant-red hover:bg-white hover:text-valorant-red text-white text-xs font-bold uppercase px-4 py-2 transition-colors clip-corner-sm"
                  >
                    Ir al Torneo
                 </Link>
               </div>
             ))
          ) : (
            <p className="text-valorant-light">No hay eventos para este día.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EventCalendar;
