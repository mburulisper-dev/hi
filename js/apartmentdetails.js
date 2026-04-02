let currentApartment = null;
let currentApartmentId = null;

document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOMContentLoaded fired');

    const apartmentId = localStorage.getItem("selectedApartmentId");
    console.log('Apartment ID from localStorage:', apartmentId);

    if (!apartmentId) {
        document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>❌ Apartment not found</h2><a href="student-dashboard.html">← Go back</a></div>';
        return;
    }

    currentApartmentId = apartmentId;
    await loadApartmentDetail();

    const reviewText = document.getElementById("reviewText");
    if (reviewText) {
        reviewText.addEventListener("input", updateCharCount);
    }
});

window.handleMessageLandlord = async function () {
    console.log('handleMessageLandlord clicked');

    if (!currentApartment) {
        showToast('Apartment not loaded yet', 'error');
        return;
    }

    const message = prompt("📧 Send message to landlord:", "");
    if (!message || !message.trim()) {
        return;
    }

    if (message.trim().length < 5) {
        showToast('Message must be at least 5 characters', 'warning');
        return;
    }

    showLoader('Sending message...');

    try {
        const response = await sendMessage(
            currentApartment.landlord_id,
            currentApartmentId,
            message.trim()
        );

        hideLoader();

        console.log('Message response:', response);

        if (response.status === 'success') {
            showToast('✅ Message sent to landlord!', 'success');
        } else {
            showToast(response.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        hideLoader();
        console.error('Error sending message:', error);
        showToast('Error sending message: ' + error.message, 'error');
    }
};

window.handleSubmitReview = async function (event) {
    event.preventDefault();
    console.log('handleSubmitReview clicked');

    const name = document.getElementById("reviewerName").value.trim();
    const text = document.getElementById("reviewText").value.trim();
    const rating = document.getElementById("rating").value;

    console.log('Form data:', { name, text, rating });

    document.getElementById("nameError").textContent = "";
    document.getElementById("textError").textContent = "";
    document.getElementById("ratingError").textContent = "";

    let isValid = true;

    if (!name || name.length < 2) {
        document.getElementById("nameError").textContent = "Name must be at least 2 characters";
        isValid = false;
    }

    if (!text || text.length < 10) {
        document.getElementById("textError").textContent = "Review must be at least 10 characters";
        isValid = false;
    }

    if (!rating) {
        document.getElementById("ratingError").textContent = "Please select a rating";
        isValid = false;
    }

    if (!isValid) {
        showToast('Please fix errors above', 'error');
        return;
    }

    showLoader('Submitting review...');

    try {
        const response = await createReview(currentApartmentId, rating, text);

        hideLoader();

        console.log('Review response:', response);

        if (response.status === 'success') {
            showToast('✅ Review submitted!', 'success');
            document.getElementById("reviewForm").reset();
            document.getElementById("charCount").textContent = "0";
            loadReviews(currentApartmentId);
        } else {
            showToast(response.message || 'Failed to submit review', 'error');
        }
    } catch (error) {
        hideLoader();
        console.error('Error submitting review:', error);
        showToast('Error submitting review: ' + error.message, 'error');
    }
};
function loadApartmentDetails(apartment) {
    let imageUrl = apartment.image_path;
    const imgElement = document.getElementById("apartmentImage");

    console.log('Raw image_path from API:', imageUrl);

    if (imageUrl && imageUrl.trim() !== '') {
        let filename = imageUrl;
        filename = filename.replace(/^\.\.\/uploads\//g, ''); 
        filename = filename.replace(/^uploads\//g, '');         
        filename = filename.replace(/^\/+/, '');                

        imageUrl = UPLOAD_URL + filename;
        console.log('Full image URL:', imageUrl);
    } else {
        imageUrl = null;
        console.log('No image path provided');
    }

    if (imageUrl) {
        imgElement.src = imageUrl;
        console.log('Setting image src to:', imageUrl);
    } else {
        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f5f5f5" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="16" fill="%23999"%3ENo Image Available%3C/text%3E%3C/svg%3E';
    }

    imgElement.onerror = function () {
        console.error('Failed to load image from URL:', this.src);
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="14" fill="%23999"%3EImage Load Error%3C/text%3E%3C/svg%3E';
    };

    imgElement.alt = apartment.title;

    document.getElementById("apartmentTitle").textContent = apartment.title;
    document.getElementById("apartmentLocation").textContent = apartment.location;
    document.getElementById("apartmentPrice").textContent = "KSh " + Number(apartment.price).toLocaleString();
    document.getElementById("apartmentRoomType").textContent = apartment.room_type || "Not specified";
    document.getElementById("addedDate").textContent = new Date(apartment.created_at).toLocaleDateString();

    const amenitiesList = document.getElementById("amenitiesList");
    amenitiesList.innerHTML = "";

    if (apartment.amenities && apartment.amenities.length > 0) {
        apartment.amenities.forEach(function (amenity) {
            const li = document.createElement("li");
            li.innerHTML = `<i class="ri-checkbox-circle-line"></i> ${amenity}`;
            amenitiesList.appendChild(li);
        });
    } else {
        amenitiesList.innerHTML = "<li style='color: #999;'>No amenities listed</li>";
    }
}
function updateCharCount() {
    const count = document.getElementById("reviewText").value.length;
    document.getElementById("charCount").textContent = count;
}

async function loadReviews(apartmentId) {
    const container = document.getElementById("reviewsContainer");
    container.innerHTML = "";

    showLoader('Loading reviews...');

    try {
        const response = await getReviews(apartmentId);
        hideLoader();

        console.log('Reviews response:', response);

        if (response.status !== 'success' || !response.data || response.data.length === 0) {
            document.getElementById("reviewCount").textContent = 0;
            container.innerHTML = '<div class="no-reviews">📝 No reviews yet!</div>';
            return;
        }

        const reviews = response.data;
        document.getElementById("reviewCount").textContent = reviews.length;

        reviews.forEach(function (review) {
            const div = document.createElement("div");
            div.className = "review-card";
            div.innerHTML = `
                <div class="review-header">
                    <h4>👤 ${escapeHtml(review.reviewer_name || 'Anonymous')}</h4>
                    <p class="review-rating">${'⭐'.repeat(review.rating)}</p>
                </div>
                <p class="review-text">${escapeHtml(review.review_text)}</p>
                <p class="review-date">🕐 ${new Date(review.created_at).toLocaleString()}</p>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        hideLoader();
        console.error('Error loading reviews:', error);
    }
}