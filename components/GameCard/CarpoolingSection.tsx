import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, UserRoundPlus, MapPin, Check, X, Clock, Users, ChevronRight, Sparkles } from 'lucide-react';
import type { CarpoolEntry } from '../../types';
import { getStoredName, setStoredName } from '../../utils/storage';
import { getRemainingSeats, getAvailableDrivers, getPendingRequests } from '../../utils/useCarpool';
import PhoneDisplay from '../PhoneDisplay';
import { DeleteIcon } from '../Icons';
import ConfirmModal from '../ConfirmModal';
import { CustomSelect } from '../ui/CustomSelect';

interface CarpoolingSectionProps {
    gameId: string;
    entries: CarpoolEntry[];
    isAdmin?: boolean;
    onAddEntry: (entry: Omit<CarpoolEntry, 'id'>) => void;
    onRemoveEntry: (entryId: string) => void;
    onRequestSeat?: (passengerId: string, driverId: string) => void;
    onAcceptPassenger?: (driverId: string, passengerId: string) => void;
    onRejectPassenger?: (driverId: string, passengerId: string) => void;
    onCancelRequest?: (passengerId: string) => void;
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'tween', duration: 0.15 } }
};

const CarpoolingSection: React.FC<CarpoolingSectionProps> = memo(({
    entries,
    isAdmin = false,
    onAddEntry,
    onRemoveEntry,
    onRequestSeat,
    onAcceptPassenger,
    onRejectPassenger,
    onCancelRequest
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<'driver' | 'passenger'>('driver');
    const [name, setName] = useState(getStoredName());
    const [phone, setPhone] = useState('');
    const [seats, setSeats] = useState(3);
    const [departureLocation, setDepartureLocation] = useState('');

    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);

    const drivers = useMemo(() => entries.filter(e => e.type === 'driver'), [entries]);
    const passengers = useMemo(() => entries.filter(e => e.type === 'passenger'), [entries]);
    const availableDrivers = useMemo(() => getAvailableDrivers(entries), [entries]);

    const storedName = getStoredName();
    const currentUserEntry = useMemo(() =>
        entries.find(e => e.name.toLowerCase() === storedName.toLowerCase()),
        [entries, storedName]
    );

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setStoredName(name);

        const entry: Omit<CarpoolEntry, 'id'> = {
            name: name.trim(),
            type: formType,
            status: 'available',
            ...(phone.trim() && { phone: phone.trim() }),
            ...({ seats }),
            ...(formType === 'driver' && departureLocation.trim() && { departureLocation: departureLocation.trim() }),
            ...(formType === 'driver' && { matchedWith: [] })
        };

        onAddEntry(entry);
        setIsFormOpen(false);
        setPhone('');
        setDepartureLocation('');
    }, [name, phone, seats, departureLocation, formType, onAddEntry]);

    const handleRemove = useCallback((entryId: string, entryName: string) => {
        if (entryName.toLowerCase() === storedName.toLowerCase()) {
            onRemoveEntry(entryId);
        } else {
            setConfirmDelete({ id: entryId, name: entryName });
        }
    }, [storedName, onRemoveEntry]);

    const executeDelete = () => {
        if (confirmDelete) {
            onRemoveEntry(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    const openForm = (type: 'driver' | 'passenger') => {
        setFormType(type);
        setIsFormOpen(true);
    };

    // Check if current user is a passenger who can request seats
    const canRequestSeat = currentUserEntry?.type === 'passenger' &&
        currentUserEntry.status === 'available' &&
        availableDrivers.length > 0;

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Covoiturage
                </h4>
                {entries.length > 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                        {drivers.length} conducteur{drivers.length > 1 ? 's' : ''} • {passengers.length} passager{passengers.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Drivers Section */}
            <AnimatePresence mode="popLayout">
                {drivers.length > 0 && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-2"
                    >
                        <h5 className="text-[11px] font-medium text-slate-400 uppercase flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5" /> Conducteurs
                        </h5>
                        <div className="space-y-2">
                            {drivers.map((driver) => {
                                const remainingSeats = getRemainingSeats(driver, entries);
                                const pendingRequests = getPendingRequests(driver.id, entries);
                                const isCurrentUser = driver.name.toLowerCase() === storedName.toLowerCase();

                                return (
                                    <motion.div
                                        key={driver.id}
                                        variants={itemVariants}
                                        layout
                                        className={`
                                            relative overflow-hidden rounded-2xl border transition-all duration-200
                                            ${isCurrentUser
                                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-blue-100 dark:shadow-blue-900/20'
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                                            }
                                            shadow-sm hover:shadow-md
                                        `}
                                    >
                                        <div className="p-3">
                                            {/* Driver Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {driver.name}
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                                                            Vous
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Seats Badge - Modern Pill Design */}
                                                <div className={`
                                                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                                                    ${remainingSeats > 0
                                                        ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-emerald-200 dark:shadow-emerald-900/30 shadow-sm'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                    }
                                                `}>
                                                    <Users className="w-3 h-3" />
                                                    <span>{remainingSeats} place{remainingSeats > 1 ? 's' : ''}</span>
                                                </div>
                                            </div>

                                            {/* Location */}
                                            {driver.departureLocation && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{driver.departureLocation}</span>
                                                </p>
                                            )}

                                            {/* Phone & Actions Row */}
                                            <div className="flex items-center justify-between gap-2">
                                                {driver.phone ? (
                                                    <PhoneDisplay phone={driver.phone} />
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Pas de téléphone</span>
                                                )}

                                                <div className="flex items-center gap-1">
                                                    {/* Request Seat Button - For passengers */}
                                                    {canRequestSeat && !isCurrentUser && remainingSeats > 0 && onRequestSeat && currentUserEntry && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => onRequestSeat(currentUserEntry.id, driver.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 
                                                                text-white text-xs font-semibold rounded-xl shadow-sm shadow-amber-200 dark:shadow-amber-900/30
                                                                hover:from-amber-500 hover:to-orange-600 transition-all cursor-pointer"
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            Demander
                                                        </motion.button>
                                                    )}

                                                    {/* Delete Button */}
                                                    {(isCurrentUser || isAdmin) && (
                                                        <button
                                                            onClick={() => handleRemove(driver.id, driver.name)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                                            aria-label="Se désinscrire"
                                                        >
                                                            <DeleteIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pending Requests Section - For driver to see */}
                                            {isCurrentUser && pendingRequests.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700"
                                                >
                                                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase mb-2 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
                                                    </p>
                                                    <div className="space-y-2">
                                                        {pendingRequests.map(request => (
                                                            <div
                                                                key={request.id}
                                                                className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                        {request.name}
                                                                    </span>
                                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-800/40 px-1.5 py-0.5 rounded">
                                                                        {request.seats || 1} pl.
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => onAcceptPassenger?.(driver.id, request.id)}
                                                                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
                                                                        aria-label="Accepter"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </motion.button>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.05 }}
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => onRejectPassenger?.(driver.id, request.id)}
                                                                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                                                                        aria-label="Refuser"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Matched Passengers Display */}
                                            {driver.matchedWith && driver.matchedWith.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700"
                                                >
                                                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                                                        <Check className="w-3 h-3" />
                                                        Passagers confirmés
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {driver.matchedWith.map(passengerId => {
                                                            const passenger = entries.find(e => e.id === passengerId);
                                                            return passenger ? (
                                                                <span
                                                                    key={passengerId}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg"
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                    {passenger.name}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Passengers Section */}
            <AnimatePresence mode="popLayout">
                {passengers.length > 0 && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-2"
                    >
                        <h5 className="text-[11px] font-medium text-slate-400 uppercase flex items-center gap-1.5">
                            <UserRoundPlus className="w-3.5 h-3.5" /> Passagers
                        </h5>
                        <div className="space-y-2">
                            {passengers.map((passenger) => {
                                const isCurrentUser = passenger.name.toLowerCase() === storedName.toLowerCase();
                                const matchedDriver = passenger.matchedWith?.[0]
                                    ? entries.find(e => e.id === passenger.matchedWith?.[0])
                                    : undefined;
                                const requestedDriver = passenger.requestedDriverId
                                    ? entries.find(e => e.id === passenger.requestedDriverId)
                                    : undefined;

                                return (
                                    <motion.div
                                        key={passenger.id}
                                        variants={itemVariants}
                                        layout
                                        className={`
                                            relative overflow-hidden rounded-2xl border transition-all duration-200
                                            ${passenger.status === 'matched'
                                                ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800'
                                                : passenger.status === 'pending'
                                                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
                                                    : isCurrentUser
                                                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800'
                                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                            }
                                            shadow-sm hover:shadow-md
                                        `}
                                    >
                                        <div className="p-3">
                                            {/* Passenger Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {passenger.name}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold rounded-md">
                                                        {passenger.seats || 1} pl.
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                                                            Vous
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Status Badge */}
                                                {passenger.status === 'matched' && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                                                        <Check className="w-3 h-3" />
                                                        Confirmé
                                                    </span>
                                                )}
                                                {passenger.status === 'pending' && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                                                        <Clock className="w-3 h-3" />
                                                        En attente
                                                    </span>
                                                )}
                                            </div>

                                            {/* Matched/Pending Info */}
                                            {matchedDriver && (
                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                                    <ChevronRight className="w-3 h-3" />
                                                    <span>Avec <strong>{matchedDriver.name}</strong></span>
                                                    {matchedDriver.phone && (
                                                        <span className="ml-2">
                                                            <PhoneDisplay phone={matchedDriver.phone} compact />
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {passenger.status === 'pending' && requestedDriver && (
                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Demande envoyée à <strong>{requestedDriver.name}</strong></span>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="mt-2 flex items-center justify-between">
                                                {passenger.phone && passenger.status !== 'matched' && (
                                                    <PhoneDisplay phone={passenger.phone} />
                                                )}
                                                {!passenger.phone && <div />}

                                                <div className="flex items-center gap-1">
                                                    {/* Cancel Request Button */}
                                                    {isCurrentUser && passenger.status === 'pending' && onCancelRequest && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => onCancelRequest(passenger.id)}
                                                            className="flex items-center gap-1 px-2 py-1 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 
                                                                text-xs font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors cursor-pointer"
                                                        >
                                                            <X className="w-3 h-3" />
                                                            Annuler
                                                        </motion.button>
                                                    )}

                                                    {/* Delete Button */}
                                                    {(isCurrentUser || isAdmin) && (
                                                        <button
                                                            onClick={() => handleRemove(passenger.id, passenger.name)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                                            aria-label="Se désinscrire"
                                                        >
                                                            <DeleteIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Available Drivers Suggestions - For available passengers */}
                                            {isCurrentUser && passenger.status === 'available' && availableDrivers.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800/40"
                                                >
                                                    <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase mb-2 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        Conducteurs disponibles
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {availableDrivers.map(driver => (
                                                            <div
                                                                key={driver.id}
                                                                className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-700"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                        {driver.name}
                                                                    </span>
                                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                                                        {getRemainingSeats(driver, entries)} pl.
                                                                    </span>
                                                                    {driver.departureLocation && (
                                                                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                                                            {driver.departureLocation}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => onRequestSeat?.(passenger.id, driver.id)}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 
                                                                        text-white text-[11px] font-semibold rounded-lg shadow-sm
                                                                        hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer"
                                                                >
                                                                    Demander
                                                                    <ChevronRight className="w-3 h-3" />
                                                                </motion.button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {entries.length === 0 && !isFormOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6"
                >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
                        <Car className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                        Aucun covoiturage proposé
                    </p>
                    <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">
                        Soyez le premier à proposer ou chercher une place !
                    </p>
                </motion.div>
            )}

            {/* Action Buttons */}
            {!isFormOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 pt-2"
                >
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => openForm('driver')}
                        className="flex-1 py-3 px-4 flex items-center justify-center gap-2
                            text-sm font-semibold text-white
                            bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl
                            shadow-lg shadow-blue-500/25 dark:shadow-blue-900/30
                            hover:from-blue-600 hover:to-indigo-700 transition-all cursor-pointer"
                    >
                        <Car className="w-4 h-4" />
                        <span>Je propose</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => openForm('passenger')}
                        className="flex-1 py-3 px-4 flex items-center justify-center gap-2
                            text-sm font-semibold text-white
                            bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl
                            shadow-lg shadow-amber-500/25 dark:shadow-amber-900/30
                            hover:from-amber-500 hover:to-orange-600 transition-all cursor-pointer"
                    >
                        <UserRoundPlus className="w-4 h-4" />
                        <span>Je cherche</span>
                    </motion.button>
                </motion.div>
            )}

            {/* Registration Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmit}
                        className="overflow-hidden"
                    >
                        <div className={`
                            p-4 rounded-2xl border-2 transition-colors
                            ${formType === 'driver'
                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800'
                                : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800'
                            }
                        `}>
                            <h5 className={`
                                font-semibold mb-4 text-sm flex items-center gap-2
                                ${formType === 'driver' ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}
                            `}>
                                {formType === 'driver' ? (
                                    <><Car className="w-5 h-5" /> Je propose des places</>
                                ) : (
                                    <><UserRoundPlus className="w-5 h-5" /> Je cherche une place</>
                                )}
                            </h5>

                            <div className="space-y-3">
                                {/* Name */}
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Votre nom *"
                                    required
                                    className="w-full px-4 py-3 text-sm text-slate-800 dark:!text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl
                                        focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600
                                        placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />

                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Téléphone (optionnel)"
                                    className="w-full px-4 py-3 text-sm text-slate-800 dark:!text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl
                                        focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600
                                        placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />

                                {/* Seats */}
                                <CustomSelect
                                    value={seats}
                                    onChange={(val) => setSeats(Number(val))}
                                    options={(formType === 'driver' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4]).map(n => ({
                                        value: n,
                                        label: `${n} place${n > 1 ? 's' : ''}`
                                    }))}
                                />

                                {/* Driver-specific: Departure Location */}
                                {formType === 'driver' && (
                                    <input
                                        type="text"
                                        value={departureLocation}
                                        onChange={(e) => setDepartureLocation(e.target.value)}
                                        placeholder="Lieu de départ (ex: Clermont-Ferrand)"
                                        className="w-full px-4 py-3 text-sm text-slate-800 dark:!text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl
                                            focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600
                                            placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 
                                        bg-slate-100 dark:bg-slate-700 rounded-xl
                                        hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    className={`
                                        flex-1 py-3 px-4 text-sm font-bold text-white rounded-xl
                                        shadow-lg transition-all cursor-pointer
                                        ${formType === 'driver'
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/25'
                                            : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-amber-500/25'
                                        }
                                    `}
                                >
                                    Confirmer
                                </motion.button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Retirer du covoiturage"
                message={`Voulez-vous vraiment retirer ${confirmDelete?.name} ?`}
                confirmText="Retirer"
                confirmStyle="danger"
                onConfirm={executeDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
});

CarpoolingSection.displayName = 'CarpoolingSection';

export default CarpoolingSection;
