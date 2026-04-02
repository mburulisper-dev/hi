// Image Gallery with Lightbox

class ImageGallery {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.createLightbox();
    }

    createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.id = 'imageLightbox';
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" onclick="gallery.close()">
                    <i class="ri-close-line"></i>
                </button>
                <button class="lightbox-prev" onclick="gallery.previous()">
                    <i class="ri-arrow-left-line"></i>
                </button>
                <img id="lightboxImage" src="" alt="Full size image" class="lightbox-image">
                <button class="lightbox-next" onclick="gallery.next()">
                    <i class="ri-arrow-right-line"></i>
                </button>
                <div class="lightbox-counter">
                    <span id="currentImageIndex">1</span> / <span id="totalImages">1</span>
                </div>
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    addImages(images) {
        this.images = images;
        document.getElementById('totalImages').textContent = images.length;
    }

    open(index = 0) {
        this.currentIndex = index;
        this.updateImage();
        document.getElementById('imageLightbox').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    close() {
        document.getElementById('imageLightbox').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.updateImage();
        }
    }

    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateImage();
        }
    }

    updateImage() {
        const img = this.images[this.currentIndex];
        document.getElementById('lightboxImage').src = img;
        document.getElementById('currentImageIndex').textContent = this.currentIndex + 1;
    }
}

// Initialize gallery
const gallery = new ImageGallery();

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox && lightbox.style.display === 'flex') {
        if (e.key === 'ArrowRight') gallery.next();
        if (e.key === 'ArrowLeft') gallery.previous();
        if (e.key === 'Escape') gallery.close();
    }
});

// Close on background click
document.addEventListener('click', function(e) {
    const lightbox = document.getElementById('imageLightbox');
    if (e.target === lightbox) {
        gallery.close();
    }
});