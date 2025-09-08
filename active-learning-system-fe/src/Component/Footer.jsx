import { useState } from "react";
import "../css/components/Footer.css";
import logo from "../css/icon/favicon11.png";

export default function Footer() {
  const galleryImages = [
    "https://www.avanse.com/blogs/images/43-new.jpg",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=62&h=56&fit=crop",
    "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=62&h=56&fit=crop",
    "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?w=62&h=56&fit=crop",
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=62&h=56&fit=crop",
    "https://kpalana.com/wp-content/uploads/2022/08/girledu_web.jpg",
    "https://www.lakemurraycountry.com/wp-content/uploads/2023/10/cayce-river-arts-600x800.jpg",
    "https://th.bing.com/th/id/OIP.JrBF6-XbOn1CrNeEBaGglQHaHa?w=1080&h=1080&rs=1&pid=ImgDetMain",
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openModal = (index) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);

  return (
    <div className="footer-container">
      <img src={logo} className="footer-logo" alt="Logo" />

      <div className="footer-sections">
        

        <div className="footer-gallery">
          <h3>Our Gallery</h3>
          <div className="gallery-grid">
            {galleryImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Gallery ${idx + 1}`}
                className="gallery-img"
                onClick={() => openModal(idx)}
              />
            ))}
          </div>
        </div>

        <div className="register-btn-wrapper">
          <a href="/courselist" className="register-btn">
            Đăng ký tại đây
          </a>
        </div>
      </div>

    <div className="footer-info">
  <div className="footer-title">ACTIVE LEARNING SYSTEM (ALS)</div>
  <p className="footer-subtitle">Nền tảng học online cho người Việt</p>
  <p>Địa chỉ: Đại học FPT Hà Nội, Khu công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội</p>
  <p>Điện thoại: 0876126324</p>
  <p>Email: digitalAuction@gmail.com</p>
  
</div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-img-wrapper">
              <img
                src={galleryImages[currentImageIndex].replace("w=62&h=56", "w=800&h=600")}
                alt={`Gallery ${currentImageIndex + 1}`}
              />
              <button className="modal-nav left" onClick={prevImage}>‹</button>
              <button className="modal-nav right" onClick={nextImage}>›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
