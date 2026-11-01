import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Catalog } from "./Catalog";

export const photo = (id, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

const heroSlides = [
  {
    image: "photo-1483985988355-763728e1935b",
    alt: "Thời trang đời thường trên phố",
    eyebrow: "LUMIQ / EVERYDAY ESSENTIALS",
    title: ["Ít hơn.", "Chất hơn."],
    description: "Thoải mái là chính mình.",
    label: "EVERYDAY COLLECTION",
  },
  {
    image: "photo-1529139574466-a303027c1d8b",
    alt: "Phong cách thời trang hiện đại giữa phố",
    eyebrow: "LUMIQ / FIND YOUR STYLE",
    title: ["Tự do.", "Tự tin."],
    description: "Mặc theo cách của bạn.",
    label: "YOUR STYLE",
  },
  {
    image: "photo-1515886657613-9f3515b0c78f",
    alt: "Phong cách cá nhân với trang phục thời trang",
    eyebrow: "LUMIQ / MADE FOR EVERY DAY",
    title: ["Gu riêng.", "Mỗi ngày."],
    description: "Dễ mặc. Dễ phối. Dễ yêu.",
    label: "MADE FOR EVERY DAY",
  },
  {
    image: "photo-1487222477894-8943e31ef7b2",
    alt: "Khám phá cảm hứng thời trang mới",
    eyebrow: "LUMIQ / THE EVERYDAY EDIT",
    title: ["Mặc chất.", "Sống vui."],
    description: "Bắt đầu từ điều bạn thích.",
    label: "THE EVERYDAY EDIT",
  },
];

export function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const currentSlide = heroSlides[activeSlide];

  useEffect(() => {
    if (
      isSliderPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [activeSlide, isSliderPaused]);

  function showSlide(direction) {
    setActiveSlide(
      (current) =>
        (current + direction + heroSlides.length) % heroSlides.length,
    );
  }

  return (
    <>
      <section
        className="hero"
        aria-roledescription="carousel"
        aria-label="Bộ sưu tập thời trang LUMIQ"
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
        onFocusCapture={() => setIsSliderPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsSliderPaused(false);
          }
        }}
      >
        {heroSlides.map((slide, index) => (
          <img
            key={slide.image}
            className={`hero-image${index === activeSlide ? " active" : ""}`}
            src={photo(slide.image)}
            alt={index === activeSlide ? slide.alt : ""}
            aria-hidden={index !== activeSlide}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === activeSlide ? "high" : "auto"}
          />
        ))}
        <div className="hero-shade" />
        <div className="hero-content" aria-live="polite">
          <p className="eyebrow">{currentSlide.eyebrow}</p>
          <h1>
            {currentSlide.title.map((line, index) => (
              <span key={line}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          <p>{currentSlide.description}</p>
          <Link className="button mint" to="/san-pham">
            Mua sắm ngay <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="hero-bottom">
          <span>LUMIQ · THOẢI MÁI LÀ CHÍNH MÌNH</span>
          <span>
            {String(activeSlide + 1).padStart(2, "0")} <i />{" "}
            {currentSlide.label}
          </span>
        </div>
        <div className="hero-controls" aria-label="Điều khiển banner">
          <button
            className="hero-arrow"
            type="button"
            onClick={() => showSlide(-1)}
            aria-label="Banner trước"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="hero-dots" role="group" aria-label="Chọn banner">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.image}
                className={`hero-dot${index === activeSlide ? " active" : ""}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={`Hiện banner ${index + 1}`}
                aria-current={index === activeSlide ? "true" : undefined}
              />
            ))}
          </div>
          <button
            className="hero-arrow"
            type="button"
            onClick={() => showSlide(1)}
            aria-label="Banner tiếp theo"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </section>
      <div className="brand-strip">
        <span>TINH GIẢN</span>
        <span>THOẢI MÁI</span>
        <span>ĐÚNG CHẤT BẠN</span>
      </div>
      <section className="section" id="collections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LUMIQ / EVERYDAY EDIT</p>
            <h2>Phong cách, theo cách bạn.</h2>
          </div>
          <Link className="text-link" to="/san-pham">
            Khám phá <ArrowRight size={17} />
          </Link>
        </div>
        <div className="collection-grid">
          <Link to="/san-pham" className="collection">
            <img
              loading="lazy"
              src={photo("photo-1483985988355-763728e1935b", 850)}
              alt="Trang phục nữ thanh lịch"
            />
            <div>
              <span>01 / EVERYDAY</span>
              <h3>Nhẹ nhàng xuống phố.</h3>
              <span>
                Xem phong cách <ArrowUpRight size={19} />
              </span>
            </div>
          </Link>
          <Link to="/san-pham" className="collection">
            <img
              loading="lazy"
              src={photo("photo-1516257984-b1b4d707412e", 850)}
              alt="Thời trang nam tối giản"
            />
            <div>
              <span>02 / YOUR STYLE</span>
              <h3>Chất riêng mỗi ngày.</h3>
              <span>
                Xem phong cách <ArrowUpRight size={19} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <Catalog home />
      <section className="story" id="story">
        <div className="story-monogram">
          <img
            loading="lazy"
            src={photo("photo-1525507119028-ed4c629a60a3", 1100)}
            alt="Chi tiết trang phục với phong cách tinh giản"
          />
          <strong>LQ</strong>
          <span>LUMIQ PHILOSOPHY</span>
        </div>
        <div>
          <p className="eyebrow">LESS, BUT BETTER.</p>
          <h2>Đẹp từ sự giản đơn.</h2>
          <p>Thoải mái là chính mình.</p>
          <Link className="text-link" to="/gioi-thieu">
            Về LUMIQ <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="membership">
        <div>
          <p className="eyebrow">LUMIQ COMMUNITY</p>
          <h2>Gia nhập LUMIQ.</h2>
        </div>
        <Link className="button" to="/dang-ky">
          Tạo tài khoản <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
