import React, { useEffect, useMemo, useState } from 'react';

import {
    Search,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    Send,
    RefreshCw
} from 'lucide-react';

import { supabase } from '../lib/supabase';

export default function HelpDesk({ triggerToast }) {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const [reply, setReply] = useState('');
    const [status, setStatus] = useState('Open');

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Load all support tickets
    const loadTickets = async () => {
        setLoading(true);

        try {
            // 1. Fetch tickets
            const { data: ticketData, error: ticketError } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (ticketError) {
                throw ticketError;
            }

            const ticketsData = ticketData || [];

            // 2. Get all user IDs from tickets
            const userIds = [
                ...new Set(
                    ticketsData
                        .map((ticket) => ticket.user_id)
                        .filter(Boolean)
                )
            ];

            let membersMap = {};

            // 3. Fetch matching members
            if (userIds.length > 0) {
                const { data: membersData, error: membersError } =
                    await supabase
                        .from('members')
                        .select(
                            'id, full_name, email, phone, member_id'
                        )
                        .in('id', userIds);

                if (membersError) {
                    throw membersError;
                }

                // Convert members array into lookup object
                membersMap = (membersData || []).reduce(
                    (acc, member) => {
                        acc[member.id] = member;
                        return acc;
                    },
                    {}
                );
            }

            // 4. Attach member information to each ticket
            const ticketsWithMembers = ticketsData.map((ticket) => ({
                ...ticket,
                member: membersMap[ticket.user_id] || null
            }));

            setTickets(ticketsWithMembers);

            // 5. Keep selected ticket updated after refresh
            if (selectedTicket) {
                const updatedSelected = ticketsWithMembers.find(
                    (ticket) => ticket.id === selectedTicket.id
                );

                if (updatedSelected) {
                    setSelectedTicket(updatedSelected);
                    setStatus(updatedSelected.status || 'Open');
                    setReply(updatedSelected.admin_reply || '');
                }
            }
        } catch (error) {
            console.error('Error loading support tickets:', error);

            if (triggerToast) {
                triggerToast(
                    'Unable to load support tickets.',
                    'error'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // Load tickets when page opens
    useEffect(() => {
        loadTickets();
    }, []);

    // Filter and search tickets
    const filteredTickets = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return tickets.filter((ticket) => {
            const matchesFilter =
                filter === 'All' || ticket.status === filter;

            if (!matchesFilter) {
                return false;
            }

            if (!searchValue) {
                return true;
            }

            return (
                ticket.ticket_number
                    ?.toLowerCase()
                    .includes(searchValue) ||
                ticket.subject
                    ?.toLowerCase()
                    .includes(searchValue) ||
                ticket.category
                    ?.toLowerCase()
                    .includes(searchValue) ||
                ticket.member?.full_name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                ticket.member?.member_id
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        });
    }, [tickets, filter, search]);

    // Open selected ticket
    const openTicket = (ticket) => {
        setSelectedTicket(ticket);
        setStatus(ticket.status || 'Open');
        setReply(ticket.admin_reply || '');
    };

    // Update ticket
    const handleUpdateTicket = async () => {
        if (!selectedTicket) {
            return;
        }

        setUpdating(true);

        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .update({
                    status,
                    admin_reply: reply.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedTicket.id)
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            // Preserve member information
            const updatedTicket = {
                ...selectedTicket,
                ...data,
                member: selectedTicket.member
            };

            // Update ticket list
            setTickets((prev) =>
                prev.map((ticket) =>
                    ticket.id === selectedTicket.id
                        ? updatedTicket
                        : ticket
                )
            );

            // Update selected ticket
            setSelectedTicket(updatedTicket);

            if (triggerToast) {
                triggerToast(
                    `Ticket ${data.ticket_number} updated successfully.`
                );
            }
        } catch (error) {
            console.error(
                'Error updating support ticket:',
                error
            );

            if (triggerToast) {
                triggerToast(
                    'Unable to update ticket. Please try again.',
                    'error'
                );
            }
        } finally {
            setUpdating(false);
        }
    };

    // Format date
    const formatDate = (date) => {
        if (!date) {
            return '—';
        }

        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format date and time
    const formatDateTime = (date) => {
        if (!date) {
            return '—';
        }

        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    // Status styling
    const getStatusClass = (ticketStatus) => {
        switch (ticketStatus) {
            case 'Resolved':
                return 'bg-green-100 text-green-700';

            case 'Closed':
                return 'bg-gray-100 text-gray-700';

            case 'In Progress':
                return 'bg-yellow-100 text-yellow-700';

            case 'Rejected':
                return 'bg-red-100 text-red-700';

            case 'Open':
            default:
                return 'bg-blue-100 text-blue-700';
        }
    };

    // Priority styling
    const getPriorityClass = (ticketPriority) => {
        switch (ticketPriority) {
            case 'Critical':
                return 'text-red-600';

            case 'High':
                return 'text-orange-600';

            case 'Medium':
                return 'text-yellow-600';

            case 'Low':
            default:
                return 'text-green-600';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>
                    <h2 className="font-display-lg text-display-lg text-on-surface">
                        Help Desk
                    </h2>

                    <p className="text-body-md text-on-surface-variant mt-1">
                        Manage member support requests and respond to tickets.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadTickets}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-semibold text-sm hover:bg-surface-container transition disabled:opacity-50"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${loading ? 'animate-spin' : ''
                            }`}
                    />

                    Refresh
                </button>

            </div>

            {/* Filters */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">

                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

                    <div className="flex flex-wrap gap-2">

                        {[
                            'All',
                            'Open',
                            'In Progress',
                            'Resolved',
                            'Closed'
                        ].map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setFilter(item)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filter === item
                                        ? 'bg-primary text-on-primary'
                                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}

                    </div>

                    <div className="relative w-full lg:w-[320px]">

                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tickets, members..."
                            className="w-full h-10 pl-9 pr-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                        />

                    </div>

                </div>

            </div>

            {/* Main Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Ticket List */}
                <div className="xl:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">

                    <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">

                        <h3 className="font-title-sm text-title-sm text-on-surface">
                            Tickets
                        </h3>

                        <span className="text-xs font-semibold text-on-surface-variant">
                            {filteredTickets.length}
                        </span>

                    </div>

                    <div className="max-h-[650px] overflow-y-auto">

                        {loading ? (
                            <div className="p-8 text-center text-sm text-on-surface-variant">
                                Loading tickets...
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="p-8 text-center text-sm text-on-surface-variant">
                                No tickets found.
                            </div>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    type="button"
                                    onClick={() => openTicket(ticket)}
                                    className={`w-full text-left p-4 border-b border-outline-variant hover:bg-surface-container-low transition ${selectedTicket?.id === ticket.id
                                            ? 'bg-surface-container-low'
                                            : ''
                                        }`}
                                >

                                    <div className="flex items-center justify-between gap-3">

                                        <span className="text-xs font-bold text-primary font-mono">
                                            {ticket.ticket_number}
                                        </span>

                                        <span
                                            className={`px-2 py-1 rounded-full text-[11px] font-bold ${getStatusClass(
                                                ticket.status
                                            )}`}
                                        >
                                            {ticket.status}
                                        </span>

                                    </div>

                                    <h4 className="mt-2 text-sm font-bold text-on-surface line-clamp-1">
                                        {ticket.subject}
                                    </h4>

                                    <div className="flex items-center justify-between mt-2">

                                        <span className="text-xs text-on-surface-variant truncate">
                                            {ticket.member?.full_name ||
                                                ticket.member?.member_id ||
                                                'Member'}
                                        </span>

                                        <span
                                            className={`text-xs font-bold ${getPriorityClass(
                                                ticket.priority
                                            )}`}
                                        >
                                            {ticket.priority}
                                        </span>

                                    </div>

                                    <div className="flex items-center gap-1 mt-2 text-[11px] text-on-surface-variant">

                                        <Clock className="w-3 h-3" />

                                        {formatDate(ticket.created_at)}

                                    </div>

                                </button>
                            ))
                        )}

                    </div>

                </div>

                {/* Ticket Details */}
                <div className="xl:col-span-2">

                    {!selectedTicket ? (

                        <div className="h-full min-h-[400px] bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center justify-center shadow-sm">

                            <div className="text-center max-w-sm px-6">

                                <MessageSquare className="w-12 h-12 mx-auto text-on-surface-variant mb-4" />

                                <h3 className="text-lg font-bold text-on-surface">
                                    Select a ticket
                                </h3>

                                <p className="text-sm text-on-surface-variant mt-2">
                                    Choose a support ticket from the list to view the member's issue and respond.
                                </p>

                            </div>

                        </div>

                    ) : (

                        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">

                            {/* Ticket Header */}
                            <div className="p-5 border-b border-outline-variant">

                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                                    <div>

                                        <div className="flex items-center gap-3 flex-wrap">

                                            <span className="text-sm font-bold text-primary font-mono">
                                                {selectedTicket.ticket_number}
                                            </span>

                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusClass(
                                                    selectedTicket.status
                                                )}`}
                                            >
                                                {selectedTicket.status}
                                            </span>

                                        </div>

                                        <h2 className="text-xl font-bold text-on-surface mt-3">
                                            {selectedTicket.subject}
                                        </h2>

                                        <p className="text-sm text-on-surface-variant mt-1">
                                            Created{' '}
                                            {formatDateTime(
                                                selectedTicket.created_at
                                            )}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* Member Information */}
                            <div className="p-5 border-b border-outline-variant">

                                <h3 className="text-sm font-bold text-on-surface mb-4">
                                    Member Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div>
                                        <p className="text-xs text-on-surface-variant">
                                            Name
                                        </p>

                                        <p className="text-sm font-semibold text-on-surface mt-1">
                                            {selectedTicket.member?.full_name ||
                                                '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-on-surface-variant">
                                            Member ID
                                        </p>

                                        <p className="text-sm font-semibold text-on-surface mt-1">
                                            {selectedTicket.member?.member_id ||
                                                '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-on-surface-variant">
                                            Email
                                        </p>

                                        <p className="text-sm font-semibold text-on-surface mt-1">
                                            {selectedTicket.member?.email ||
                                                '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-on-surface-variant">
                                            Phone
                                        </p>

                                        <p className="text-sm font-semibold text-on-surface mt-1">
                                            {selectedTicket.member?.phone ||
                                                '—'}
                                        </p>
                                    </div>

                                </div>

                            </div>

                            {/* Ticket Details */}
                            <div className="p-5 border-b border-outline-variant">

                                <div className="flex items-center gap-3 mb-4">

                                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>

                                    <div>

                                        <p className="text-xs text-on-surface-variant">
                                            Category
                                        </p>

                                        <p className="text-sm font-bold text-on-surface">
                                            {selectedTicket.category}
                                        </p>

                                    </div>

                                    <div className="ml-auto text-right">

                                        <p className="text-xs text-on-surface-variant">
                                            Priority
                                        </p>

                                        <p
                                            className={`text-sm font-bold ${getPriorityClass(
                                                selectedTicket.priority
                                            )}`}
                                        >
                                            {selectedTicket.priority}
                                        </p>

                                    </div>

                                </div>

                                <div className="bg-surface-container-low rounded-lg p-4">

                                    <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                                        {selectedTicket.message}
                                    </p>

                                </div>

                            </div>

                            {/* Existing Admin Reply */}
                            {selectedTicket.admin_reply && (
                                <div className="p-5 border-b border-outline-variant">

                                    <div className="flex items-center gap-2 mb-3">

                                        <CheckCircle2 className="w-5 h-5 text-green-600" />

                                        <h3 className="text-sm font-bold text-on-surface">
                                            Current Admin Reply
                                        </h3>

                                    </div>

                                    <div className="bg-green-50 rounded-lg p-4">

                                        <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                                            {selectedTicket.admin_reply}
                                        </p>

                                    </div>

                                </div>
                            )}

                            {/* Admin Controls */}
                            <div className="p-5 space-y-5">

                                <div>

                                    <label className="block text-xs font-bold text-on-surface-variant mb-2">
                                        Ticket Status
                                    </label>

                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value="Open">
                                            Open
                                        </option>

                                        <option value="In Progress">
                                            In Progress
                                        </option>

                                        <option value="Resolved">
                                            Resolved
                                        </option>

                                        <option value="Closed">
                                            Closed
                                        </option>
                                    </select>

                                </div>

                                <div>

                                    <label className="block text-xs font-bold text-on-surface-variant mb-2">
                                        Admin Reply
                                    </label>

                                    <textarea
                                        rows="5"
                                        value={reply}
                                        onChange={(e) =>
                                            setReply(e.target.value)
                                        }
                                        placeholder="Write your response to the member..."
                                        className="w-full p-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus:outline-none focus:border-primary resize-none"
                                    />

                                </div>

                                <div className="flex justify-end">

                                    <button
                                        type="button"
                                        onClick={handleUpdateTicket}
                                        disabled={updating}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:opacity-95 transition disabled:opacity-60"
                                    >

                                        {updating ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Update Ticket
                                            </>
                                        )}

                                    </button>

                                </div>

                            </div>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}