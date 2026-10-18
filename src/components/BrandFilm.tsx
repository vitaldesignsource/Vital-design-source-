import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Pause, Play, RotateCcw } from "lucide-react";
import { brandFilm } from "../lib/brand-film";

type PlaybackState =
  "idle" | "loading" | "playing" | "paused" | "ended" | "blocked" | "error";

const descriptions: Record<PlaybackState, string> = {
  idle: "A silent identity film. Play when you’re ready.",
  loading: "Preparing the film…",
  playing: "Silver, light, and the Vital identity.",
  paused: "Film paused.",
  ended: "The Vital signature. Watch it again.",
  blocked: "Press play to watch the film.",
  error: "The film is unavailable. You can try again.",
};

/** A poster-first film: its media source is attached only after a play request. */
export function BrandFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const wantsPlayback = useRef(false);
  const inViewport = useRef(false);
  const suspended = useRef(true);
  const mounted = useRef(false);
  const playAttempt = useRef(0);
  const currentState = useRef<PlaybackState>("idle");
  const [state, setState] = useState<PlaybackState>("idle");
  const [hasSource, setHasSource] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const videoId = useId();
  const descriptionId = useId();

  const updateState = useCallback((value: PlaybackState) => {
    currentState.current = value;
    setState(value);
  }, []);

  const play = useCallback(async () => {
    const element = video.current;
    if (!element || !wantsPlayback.current || suspended.current) return;
    const attempt = ++playAttempt.current;
    updateState("loading");
    try {
      await element.play();
    } catch {
      // A visibility pause, a newer play request, or unmount can interrupt play.
      if (
        !mounted.current ||
        attempt !== playAttempt.current ||
        !wantsPlayback.current ||
        suspended.current
      )
        return;
      wantsPlayback.current = false;
      setHasFrame(false);
      if (currentState.current !== "error") updateState("blocked");
    }
  }, [updateState]);

  useEffect(() => {
    mounted.current = true;
    const element = video.current;
    const viewport = screen.current;
    if (!element || !viewport) return;

    const updateVisibility = () => {
      suspended.current =
        !inViewport.current ||
        document.hidden ||
        document.visibilityState === "hidden";
      if (suspended.current) {
        ++playAttempt.current;
        element.pause();
        if (wantsPlayback.current) updateState("paused");
      } else if (wantsPlayback.current && element.paused) {
        void play();
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewport.current =
          entry.isIntersecting && entry.intersectionRatio >= 0.2;
        updateVisibility();
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(viewport);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      mounted.current = false;
      wantsPlayback.current = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      element.pause();
    };
  }, [play, updateState]);

  useEffect(() => {
    if (hasSource && wantsPlayback.current) void play();
  }, [hasSource, play]);

  const togglePlayback = () => {
    const element = video.current;
    if (!element) return;
    if (wantsPlayback.current) {
      wantsPlayback.current = false;
      ++playAttempt.current;
      element.pause();
      updateState("paused");
      return;
    }
    const previous = currentState.current;
    wantsPlayback.current = true;
    updateState("loading");
    if (!hasSource) {
      setHasSource(true);
      return;
    }
    if (previous === "error") {
      setHasFrame(false);
      element.load();
    } else if (previous === "ended") {
      element.currentTime = 0;
    }
    void play();
  };

  const handlePause = () => {
    if (!mounted.current || currentState.current === "error") return;
    if (!suspended.current) wantsPlayback.current = false;
    if (currentState.current !== "ended") updateState("paused");
  };

  const handleError = () => {
    wantsPlayback.current = false;
    ++playAttempt.current;
    updateState("error");
    video.current?.pause();
    setHasFrame(false);
  };

  const isPlaying = state === "playing" || state === "loading";
  const buttonLabel = isPlaying
    ? "Pause brand film"
    : state === "ended"
      ? "Replay brand film"
      : "Play brand film";
  const ButtonIcon =
    state === "loading"
      ? LoaderCircle
      : isPlaying
        ? Pause
        : state === "ended"
          ? RotateCcw
          : Play;

  return (
    <section
      id="brand-film"
      className="brand-film page-width"
      aria-labelledby="brand-film-title"
    >
      <div className="brand-film-heading">
        <div>
          <p className="eyebrow brand-film-eyebrow">Brand in motion</p>
          <h2 id="brand-film-title">{brandFilm.title}</h2>
        </div>
        <p id={descriptionId}>{brandFilm.description}</p>
      </div>

      <figure
        className="brand-film-player"
        data-state={state}
        data-frame={hasFrame ? "true" : "false"}
      >
        <div className="brand-film-screen" ref={screen}>
          <img
            className="brand-film-poster"
            src={brandFilm.poster}
            alt=""
            width={brandFilm.width}
            height={brandFilm.height}
            loading="lazy"
            decoding="async"
          />
          <video
            id={videoId}
            ref={video}
            className="brand-film-video"
            aria-label="Vital Design Source brand film"
            aria-describedby={descriptionId}
            src={hasSource ? brandFilm.source : undefined}
            poster={brandFilm.poster}
            width={brandFilm.width}
            height={brandFilm.height}
            preload="none"
            muted
            playsInline
            controls={hasFrame}
            tabIndex={hasFrame ? 0 : -1}
            onPlay={() => {
              if (suspended.current) {
                video.current?.pause();
                return;
              }
              wantsPlayback.current = true;
            }}
            onPlaying={() => {
              if (suspended.current) {
                video.current?.pause();
                return;
              }
              wantsPlayback.current = true;
              setHasFrame(true);
              updateState("playing");
            }}
            onPause={handlePause}
            onWaiting={() => {
              if (wantsPlayback.current && !suspended.current)
                updateState("loading");
            }}
            onEnded={() => {
              wantsPlayback.current = false;
              ++playAttempt.current;
              updateState("ended");
            }}
            onError={handleError}
          />
          <span className="brand-film-frame-label eyebrow" aria-hidden="true">
            Vital / The identity film
          </span>
        </div>
        <figcaption className="brand-film-caption">
          <div>
            <p className="eyebrow brand-film-caption-title">
              The Vital signature
            </p>
            <p className="brand-film-status" role="status" aria-live="polite">
              {descriptions[state]}
            </p>
          </div>
          <button
            className="brand-film-control"
            type="button"
            aria-label={buttonLabel}
            aria-controls={videoId}
            onClick={togglePlayback}
          >
            <ButtonIcon size={16} aria-hidden="true" />
            {isPlaying
              ? "Pause film"
              : state === "ended"
                ? "Replay film"
                : state === "error"
                  ? "Retry film"
                  : "Play film"}
          </button>
        </figcaption>
      </figure>
    </section>
  );
}
