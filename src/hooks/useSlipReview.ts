import { useState, useEffect, useCallback, useRef } from "react";
import { api, type SlipReviewQueued, type SlipReviewProgress, type SlipReviewEvent, type GameData, type LegCompletedPayload, type SlipReviewPublic, type StreamTokenResponse, type SlipReviewStatus } from "../lib/api";

export interface SlipReviewState {
  reviewId: number | null;
  status: SlipReviewStatus;
  progress: SlipReviewProgress | null;
  games: GameData[];
  latestEventId: number;
  isConnected: boolean;
  error: string | null;
  finalReview: SlipReviewPublic | null;
}

const initialState: SlipReviewState = {
  reviewId: null,
  status: "queued",
  progress: null,
  games: [],
  latestEventId: 0,
  isConnected: false,
  error: null,
  finalReview: null,
};

export function useSlipReview() {
  const [state, setState] = useState<SlipReviewState>(initialState);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamTokenRef = useRef<string | null>(null);

  const fetchFinalReview = useCallback(async (reviewId: number) => {
    try {
      const review = await api.getSlipReviewPublic(reviewId);
      setState((prev) => ({
        ...prev,
        finalReview: review,
        status: review.status,
      }));
    } catch (err) {
      console.error("Failed to fetch final review:", err);
    }
  }, []);

  const handleEvent = useCallback((event: SlipReviewEvent) => {
    setState((prev) => {
      const newState = { ...prev, latestEventId: Math.max(prev.latestEventId, event.id) };

      switch (event.event_type) {
        case "review.queued":
        case "review.progress": {
          const payload = event.payload as { status?: string; progress?: SlipReviewProgress };
          if (payload.progress) {
            newState.progress = payload.progress;
          }
          if (payload.status) {
            newState.status = payload.status as SlipReviewStatus;
          }
          break;
        }

        case "review.fanout_queued": {
          const payload = event.payload as { total?: number };
          newState.progress = {
            phase: "analysing_legs",
            total: payload.total || 0,
            completed: 0,
            percent: 0,
            message: `Analysing ${payload.total || 0} games...`,
          };
          break;
        }

        case "leg.started": {
          const payload = event.payload as { total?: number; completed?: number };
          newState.progress = {
            phase: "analysing_legs",
            total: payload.total || newState.progress?.total || 0,
            completed: payload.completed || newState.progress?.completed || 0,
            percent: Math.round(((payload.completed || 0) / (payload.total || 1)) * 100),
            message: `Analysing ${payload.completed || 0} of ${payload.total || 0} selections.`,
          };
          break;
        }

        case "leg.completed": {
          const payload = event.payload as LegCompletedPayload;
          // Add or update the game in the list
          const existingIndex = newState.games.findIndex((g) => g.id === payload.game.id);
          if (existingIndex >= 0) {
            newState.games = [...newState.games];
            newState.games[existingIndex] = payload.game;
          } else {
            // Insert at the correct position based on order
            newState.games = [...newState.games, payload.game].sort((a, b) => {
              const orderA = (payload.order || 0);
              const orderB = (payload.order || 0);
              return orderA - orderB;
            });
          }
          // Update progress
          newState.progress = {
            phase: "analysing_legs",
            total: payload.total,
            completed: payload.completed,
            percent: Math.round((payload.completed / payload.total) * 100),
            message: `Analysed ${payload.completed} of ${payload.total} selections.`,
          };
          break;
        }

        case "leg.failed": {
          const payload = event.payload as { completed?: number; total?: number; error?: string };
          newState.progress = {
            phase: "analysing_legs",
            total: payload.total || newState.progress?.total || 0,
            completed: payload.completed || newState.progress?.completed || 0,
            percent: Math.round(((payload.completed || 0) / (payload.total || 1)) * 100),
            message: payload.error || "Analysis failed for one selection.",
          };
          break;
        }

        case "review.completed": {
          const payload = event.payload as { status: string; total: number; completed: number; progress: SlipReviewProgress };
          newState.status = "completed";
          newState.progress = payload.progress;
          // Fetch final review
          if (newState.reviewId) {
            fetchFinalReview(newState.reviewId);
          }
          break;
        }

        case "review.failed": {
          const payload = event.payload as { error?: string; error_code?: string };
          newState.status = "failed";
          newState.error = payload.error || "Slip review failed.";
          newState.progress = {
            phase: "failed",
            total: newState.progress?.total || 0,
            completed: newState.progress?.completed || 0,
            percent: 100,
            message: payload.error || "Slip review failed.",
          };
          break;
        }

        default:
          break;
      }

      return newState;
    });
  }, [fetchFinalReview]);

  const connectWebSocket = useCallback(async (reviewId: number, lastEventId?: number) => {
    try {
      // Get stream token
      const tokenResponse: StreamTokenResponse = await api.getSlipReviewStreamToken(reviewId);
      streamTokenRef.current = tokenResponse.ticket;

      // Build WebSocket URL
      let wsUrl = tokenResponse.ws_url;
      if (lastEventId !== undefined && lastEventId > 0) {
        const separator = wsUrl.includes("?") ? "&" : "?";
        wsUrl = `${wsUrl}${separator}last_event_id=${lastEventId}`;
      }

      // Close existing socket
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setState((prev) => ({ ...prev, isConnected: true, error: null }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle snapshot
          if (data.type === "slip_review.snapshot") {
            setState((prev) => ({
              ...prev,
              status: data.status as SlipReviewStatus,
              progress: data.progress,
              latestEventId: data.latest_event_id,
              games: [], // Reset games on snapshot
            }));
            return;
          }

          // Handle event
          if (data.type === "slip_review.event") {
            const slipEvent: SlipReviewEvent = {
              id: data.id,
              review_id: data.review_id,
              event_type: data.event_type,
              payload: data.payload,
              created_at: data.created_at,
            };
            handleEvent(slipEvent);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      socket.onerror = () => {
        setState((prev) => ({ ...prev, error: "WebSocket connection error" }));
      };

      socket.onclose = () => {
        setState((prev) => ({ ...prev, isConnected: false }));

        // Attempt to reconnect if not in terminal state
        const terminalStatuses: SlipReviewStatus[] = ["completed", "partial", "failed"];
        if (!terminalStatuses.includes(state.status)) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(reviewId, state.latestEventId);
          }, 3000);
        }
      };
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
      setState((prev) => ({ ...prev, error: "Failed to connect to stream" }));
    }
  }, [handleEvent, state.status, state.latestEventId]);

  const startReview = useCallback(async (code: string, days = 3) => {
    try {
      setState(initialState);
      const response: SlipReviewQueued = await api.createSlipReview({ code, days });
      
      setState((prev) => ({
        ...prev,
        reviewId: response.id,
        status: response.status,
        progress: response.summary.progress,
        latestEventId: response.latest_event_id || 0,
      }));

      // Connect to WebSocket
      await connectWebSocket(response.id);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to start slip review",
      }));
    }
  }, [connectWebSocket]);

  const reconnect = useCallback(async () => {
    if (state.reviewId) {
      await connectWebSocket(state.reviewId, state.latestEventId);
    }
  }, [connectWebSocket, state.reviewId, state.latestEventId]);

  const fetchEventsFallback = useCallback(async () => {
    if (!state.reviewId) return;
    
    try {
      const response = await api.getSlipReviewEvents(state.reviewId, state.latestEventId);
      
      setState((prev) => ({
        ...prev,
        status: response.status,
        progress: response.progress,
      }));

      // Process events
      for (const event of response.events) {
        if (event.id > state.latestEventId) {
          handleEvent(event);
        }
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  }, [state.reviewId, state.latestEventId, handleEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startReview,
    reconnect,
    fetchEventsFallback,
    fetchFinalReview,
  };
}
