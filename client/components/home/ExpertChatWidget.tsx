"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CloseIcon,
  DoubleCheckIcon,
  ImageIcon,
  MessagesIcon,
  SearchIcon,
  SendIcon,
} from "@/components/icons";
import UserAvatar from "@/components/shared/UserAvatar";
import { Link } from "@/i18n/navigation";
import {
  getMessages,
  getUnreadMessageCount,
  markConversationRead,
  sendMessage,
  startConversation,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat";
import { categoryName, getVerifiedExperts, type VerifiedExpert } from "@/lib/expert";
import { useSignedInUser } from "@/lib/session";

type SelectedPhoto = {
  file: File;
  previewUrl: string;
};

type ExpertChatWidgetProps = {
  initialExperts?: VerifiedExpert[];
};

export default function ExpertChatWidget({ initialExperts = [] }: ExpertChatWidgetProps) {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [currentUser] = useSignedInUser();

  const [isOpen, setIsOpen] = useState(false);
  const [showPill, setShowPill] = useState(true);
  const [experts, setExperts] = useState<VerifiedExpert[]>(initialExperts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpert, setSelectedExpert] = useState<VerifiedExpert | null>(null);

  // Chat conversation state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch unread count for logged-in user
  useEffect(() => {
    if (currentUser?.role === "FARMER") {
      getUnreadMessageCount()
        .then(setUnreadCount)
        .catch(() => {});
    }
  }, [currentUser]);

  // Load verified experts if not provided initially
  useEffect(() => {
    if (experts.length === 0) {
      getVerifiedExperts()
        .then(setExperts)
        .catch(() => {});
    }
  }, [experts.length]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (selectedExpert && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedExpert]);

  // Clean up object URLs on unmount
  const selectedPhotosRef = useRef(selectedPhotos);
  selectedPhotosRef.current = selectedPhotos;
  useEffect(() => {
    return () => {
      selectedPhotosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  // Open chat with a specific expert
  const handleSelectExpert = async (expert: VerifiedExpert) => {
    setSelectedExpert(expert);
    setChatError(null);
    setSelectedPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });

    // If visitor is not logged in or not a farmer, we only show the profile view
    if (!currentUser || currentUser.role !== "FARMER") {
      return;
    }

    setLoadingChat(true);
    try {
      const conv = await startConversation(expert.user.id);
      setConversation(conv);
      const page = await getMessages(conv.id);
      setMessages(page.messages);
      if (conv.unreadCount > 0) {
        markConversationRead(conv.id).catch(() => {});
        setUnreadCount((prev) => Math.max(0, prev - conv.unreadCount));
      }
    } catch {
      setChatError(
        isBn
          ? "কথোপকথন শুরু করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
          : "Could not open chat with this expert. Please try again."
      );
    } finally {
      setLoadingChat(false);
    }
  };

  // Poll for new messages when a conversation is active
  useEffect(() => {
    if (!isOpen || !conversation || !selectedExpert || currentUser?.role !== "FARMER") {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const page = await getMessages(conversation.id);
        setMessages((prev) => {
          if (page.messages.length !== prev.length) {
            markConversationRead(conversation.id).catch(() => {});
            return page.messages;
          }
          return prev;
        });
      } catch {
        // Silently continue polling
      }
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, conversation, selectedExpert, currentUser]);

  // Send a message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!conversation || (!messageText.trim() && selectedPhotos.length === 0) || isSending) {
      return;
    }

    const content = messageText.trim();
    const photosToSend = [...selectedPhotos];
    setMessageText("");
    setSelectedPhotos([]);
    setIsSending(true);

    try {
      const files = photosToSend.map((p) => p.file);
      const sentMsg = await sendMessage(conversation.id, content, files);
      photosToSend.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setMessages((prev) => [...prev, sentMsg]);
    } catch {
      setChatError(
        isBn ? "বার্তা পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।" : "Failed to send message. Please try again."
      );
      setMessageText(content);
      setSelectedPhotos(photosToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems: SelectedPhoto[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedPhotos((prev) => {
      const merged = [...prev, ...newItems];
      if (merged.length > 5) {
        merged.slice(5).forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return merged.slice(0, 5);
      }
      return merged;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const filteredExperts = experts.filter((expert) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = expert.user.name.toLowerCase().includes(q);
    const specMatch = expert.specialization.toLowerCase().includes(q);
    const orgMatch = expert.organization?.toLowerCase().includes(q);
    const catMatch = expert.categories.some((c) =>
      categoryName(c, locale).toLowerCase().includes(q)
    );
    return nameMatch || specMatch || orgMatch || catMatch;
  });

  return (
    <>
      {/* Floating Widget Trigger Button & Notification Pill */}
      <aside aria-label={isBn ? "কৃষি বিশেষজ্ঞ চ্যাট" : "Expert Chat"} className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Helper popup pill for visitors */}
        {!isOpen && showPill && (
          <div className="relative hidden sm:flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 shadow-xl shadow-zinc-900/10 border border-zinc-200/80 backdrop-blur-md transition-all animate-in fade-in slide-in-from-right-4">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-zinc-800">
              {isBn ? "বিশেষজ্ঞদের পরামর্শ নিন" : "Ask an Agriculture Expert"}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPill(false);
              }}
              className="ml-1 text-zinc-400 hover:text-zinc-600 transition"
              aria-label={isBn ? "বন্ধ করুন" : "Dismiss"}
            >
              <CloseIcon className="size-3.5" />
            </button>
          </div>
        )}

        {/* Primary Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowPill(false);
          }}
          aria-label={isOpen ? (isBn ? "চ্যাট উইজেট বন্ধ করুন" : "Close chat") : (isBn ? "বিশেষজ্ঞদের সাথে চ্যাট খুলুন" : "Open expert chat")}
          className="group relative flex size-14 items-center justify-center rounded-full bg-linear-to-tr from-brand to-emerald-600 text-white shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:shadow-emerald-900/40 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
        >
          {/* Pulsing glow ring when idle */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-pulse pointer-events-none" />
          )}

          {/* Unread badge */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white animate-bounce">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          {/* Icon */}
          <div className="transition-transform duration-300">
            {isOpen ? <CloseIcon className="size-6 text-white" /> : <MessagesIcon className="size-6 text-white" />}
          </div>
        </button>
      </aside>

      {/* Floating Chat Modal / Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isBn ? "বিশেষজ্ঞ চ্যাট উইন্ডো" : "Expert Chat Window"}
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-[580px] max-h-[calc(100vh-120px)] w-[calc(100vw-2rem)] sm:w-[410px] flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/25 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <header className="relative flex items-center justify-between border-b border-emerald-800/20 bg-linear-to-r from-emerald-800 via-brand to-emerald-700 px-5 py-4 text-white shadow-sm">
            {selectedExpert ? (
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExpert(null);
                    setConversation(null);
                    setMessages([]);
                    setChatError(null);
                  }}
                  className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white transition"
                  aria-label={isBn ? "বিশেষজ্ঞদের তালিকায় ফিরে যান" : "Back to experts list"}
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative">
                  <UserAvatar name={selectedExpert.user.name} image={selectedExpert.user.image} size={38} />
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-800" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-medium text-sm text-white flex items-center gap-1.5">
                    {selectedExpert.user.name}
                    <span className="grid size-3.5 place-items-center rounded-full bg-white text-brand" title={isBn ? "ভেরিফাইড" : "Verified"}>
                      <CheckIcon className="size-2.5" />
                    </span>
                  </h3>
                  <p className="truncate text-xs text-white/80">{selectedExpert.specialization}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-2xl bg-white/15 text-white shadow-inner">
                  <MessagesIcon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight text-white">
                    {isBn ? "কৃষি বিশেষজ্ঞ পরামর্শ" : "Agromate Expert Chat"}
                  </h3>
                  <p className="flex items-center gap-1.5 text-xs text-emerald-100/80">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    {isBn ? "সরাসরি সহায়তা উপলব্ধ" : "Verified Specialists Online"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              {currentUser?.role === "FARMER" && selectedExpert && (
                <Link
                  href={`/dashboard/messages?with=${selectedExpert.user.id}`}
                  className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition"
                  title={isBn ? "পূর্ণাঙ্গ চ্যাটে খুলুন" : "Open in full chat"}
                >
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition"
                aria-label={isBn ? "উইন্ডো বন্ধ করুন" : "Close window"}
              >
                <CloseIcon className="size-4.5" />
              </button>
            </div>
          </header>

          {/* Body Content */}
          <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50/50">
            {/* View 1: List of Experts */}
            {!selectedExpert ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="p-3 bg-white border-b border-zinc-200/80">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isBn ? "বিশেষজ্ঞ বা বিষয় খুঁজুন..." : "Search expert or topic..."}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 py-2 pl-9 pr-3 text-xs text-zinc-800 placeholder-zinc-400 transition focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        <CloseIcon className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtitle intro */}
                <div className="bg-emerald-50/60 px-4 py-2 text-[11px] text-emerald-800 flex items-center justify-between border-b border-emerald-100">
                  <span>
                    {isBn
                      ? "পছন্দের বিশেষজ্ঞ নির্বাচন করে চ্যাট শুরু করুন"
                      : "Choose a specialist to start a direct consultation"}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {filteredExperts.length} {isBn ? "জন বিশেষজ্ঞ" : "experts"}
                  </span>
                </div>

                {/* Experts List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {filteredExperts.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-xs">
                      {isBn ? "কোনো বিশেষজ্ঞ পাওয়া যায়নি" : "No verified experts match your search"}
                    </div>
                  ) : (
                    filteredExperts.map((expert) => (
                      <div
                        key={expert.id}
                        onClick={() => handleSelectExpert(expert)}
                        className="group flex items-start gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-xs transition hover:border-brand/40 hover:bg-emerald-50/20 hover:shadow-md cursor-pointer"
                      >
                        <UserAvatar name={expert.user.name} image={expert.user.image} size={46} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="truncate text-xs font-semibold text-zinc-900 group-hover:text-brand transition">
                              {expert.user.name}
                            </h4>
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              {isBn ? `${expert.experienceYears} বছর অভিজ্ঞতা` : `${expert.experienceYears}y exp`}
                            </span>
                          </div>
                          <p className="truncate text-[11px] font-medium text-brand mt-0.5">
                            {expert.specialization}
                          </p>
                          {expert.organization && (
                            <p className="truncate text-[10px] text-zinc-500 mt-0.5">
                              {expert.organization}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {expert.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat.id}
                                  className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-600"
                                >
                                  {categoryName(cat, locale)}
                                </span>
                              ))}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand group-hover:translate-x-0.5 transition-transform">
                              {isBn ? "চ্যাট করুন" : "Chat"} &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer status notice */}
                <div className="border-t border-zinc-200/70 bg-white p-2.5 text-center text-[11px] text-zinc-500">
                  {currentUser ? (
                    <span>
                      {isBn ? "লগইন করা আছেন: " : "Signed in as: "}
                      <strong className="text-zinc-700">{currentUser.name}</strong> ({currentUser.role})
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      {isBn ? "সরাসরি বার্তা পাঠাতে" : "To chat live,"}
                      <Link href="/login" className="font-semibold text-brand hover:underline">
                        {isBn ? "লগইন করুন" : "Log in"}
                      </Link>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* View 2: Active Chat / Expert Profile */
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Non-authenticated or Non-farmer state: Show Expert Card & Login Prompt */}
                {!currentUser || currentUser.role !== "FARMER" ? (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <UserAvatar name={selectedExpert.user.name} image={selectedExpert.user.image} size={72} />
                    <h3 className="mt-3 font-semibold text-base text-zinc-900 flex items-center justify-center gap-1.5">
                      {selectedExpert.user.name}
                      <span className="grid size-4 place-items-center rounded-full bg-brand text-white">
                        <CheckIcon className="size-3" />
                      </span>
                    </h3>
                    <p className="text-xs font-medium text-brand mt-0.5">{selectedExpert.specialization}</p>
                    {selectedExpert.organization && (
                      <p className="text-xs text-zinc-500 mt-1">{selectedExpert.organization}</p>
                    )}
                    {selectedExpert.bio && (
                      <p className="mt-3 max-w-xs text-xs text-zinc-600 line-clamp-3 bg-white p-3 rounded-xl border border-zinc-200/80 italic">
                        &ldquo;{selectedExpert.bio}&rdquo;
                      </p>
                    )}

                    <div className="mt-6 w-full rounded-2xl bg-emerald-50/90 p-4 border border-emerald-100">
                      <p className="text-xs text-emerald-950 font-medium">
                        {currentUser?.role === "EXPERT" || currentUser?.role === "ADMIN"
                          ? isBn
                            ? "আপনি এক্সপার্ট/অ্যাডমিন হিসেবে লগইন আছেন। আপনার ড্যাশবোর্ডে বার্তা দেখুন।"
                            : "You are logged in as an expert or admin. Check your dashboard messages."
                          : isBn
                          ? "এই বিশেষজ্ঞের সাথে সরাসরি চ্যাট করতে কৃষক একাউন্টে লগইন করুন।"
                          : "Log in with your farmer account to start a live consultation with this expert."}
                      </p>

                      <div className="mt-4 flex flex-col gap-2">
                        {currentUser?.role === "EXPERT" || currentUser?.role === "ADMIN" ? (
                          <Link
                            href={currentUser.role === "EXPERT" ? "/expert/messages" : "/admin/messages"}
                            className="w-full rounded-full bg-brand py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                          >
                            {isBn ? "ড্যাশবোর্ড মেসেজ দেখুন" : "Go to Messages"}
                          </Link>
                        ) : (
                          <>
                            <Link
                              href="/login"
                              className="w-full rounded-full bg-brand py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              {isBn ? "লগইন করুন" : "Log In to Chat"}
                            </Link>
                            <Link
                              href="/register"
                              className="w-full rounded-full border border-zinc-300 bg-white py-2 text-xs font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50"
                            >
                              {isBn ? "নতুন একাউন্ট তৈরি করুন" : "Create Farmer Account"}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Farmer state: Full Live Messaging */
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Error Banner */}
                    {chatError && (
                      <div className="bg-rose-50 px-3 py-1.5 text-center text-xs text-rose-700 border-b border-rose-100 flex items-center justify-between">
                        <span>{chatError}</span>
                        <button
                          type="button"
                          onClick={() => setChatError(null)}
                          className="text-rose-500 hover:text-rose-800"
                        >
                          &times;
                        </button>
                      </div>
                    )}

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                      {loadingChat ? (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                          <span className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-brand animate-ping" />
                            {isBn ? "কথোপকথন লোড হচ্ছে..." : "Loading messages..."}
                          </span>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-6 text-center text-zinc-400">
                          <div className="size-10 rounded-full bg-emerald-50 text-brand grid place-items-center mb-2">
                            <MessagesIcon className="size-5" />
                          </div>
                          <p className="text-xs font-medium text-zinc-600">
                            {isBn
                              ? `${selectedExpert.user.name}-কে আপনার ফসলের যেকোনো সমস্যা বা প্রশ্ন লিখুন।`
                              : `Ask ${selectedExpert.user.name} any question regarding your crops or farming.`}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            {isBn ? "ছবিসহ বিস্তারিত বার্তা পাঠানো যাবে।" : "You can also attach crop photos."}
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.senderId === currentUser.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                                  isMe
                                    ? "bg-brand text-white rounded-tr-xs"
                                    : "bg-white text-zinc-900 border border-zinc-200/90 rounded-tl-xs"
                                }`}
                              >
                                {/* Photos if any */}
                                {msg.imageUrls && msg.imageUrls.length > 0 && (
                                  <div className="mb-2 grid grid-cols-2 gap-1.5 overflow-hidden rounded-lg">
                                    {msg.imageUrls.map((imgUrl, i) => (
                                      <a
                                        key={i}
                                        href={imgUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="relative block aspect-square overflow-hidden rounded-md bg-zinc-100"
                                      >
                                        <Image
                                          src={imgUrl}
                                          alt="Attachment"
                                          fill
                                          sizes="150px"
                                          className="object-cover"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                                <div
                                  className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                                    isMe ? "text-emerald-100/90" : "text-zinc-400"
                                  }`}
                                >
                                  <span>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {isMe && (
                                    <span>
                                      {msg.isRead ? (
                                        <DoubleCheckIcon className="size-3 text-emerald-200" />
                                      ) : (
                                        <CheckIcon className="size-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Photo Previews */}
                    {selectedPhotos.length > 0 && (
                      <div className="flex gap-2 border-t border-zinc-200 bg-white p-2 overflow-x-auto">
                        {selectedPhotos.map((photo, i) => (
                          <div key={photo.previewUrl} className="relative size-12 shrink-0 rounded-lg border border-zinc-200 overflow-hidden">
                            <Image src={photo.previewUrl} alt="Preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input Composer */}
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-center gap-2 border-t border-zinc-200 bg-white p-2.5"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-brand transition"
                        title={isBn ? "ছবি সংযুক্ত করুন" : "Attach photos"}
                      >
                        <ImageIcon className="size-4.5" />
                      </button>

                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={isBn ? "এখানে বার্তা লিখুন..." : "Type a message..."}
                        className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                      />

                      <button
                        type="submit"
                        disabled={isSending || (!messageText.trim() && selectedPhotos.length === 0)}
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-brand"
                        title={isBn ? "পাঠান" : "Send"}
                      >
                        {isSending ? (
                          <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <SendIcon className="size-3.5" />
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
