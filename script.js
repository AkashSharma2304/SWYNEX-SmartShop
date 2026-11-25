const productsContainer = document.querySelector(".products-container");
const cartLink = document.querySelector("#cartLink");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchbox");
const sortSelect = document.querySelector("#sort-by");
const productCount = document.querySelector("#productCount");
const sidebarCategories = document.querySelector(".sidebar-categories");
const pagination = document.querySelector("#pagination");
const pageNumbers = document.querySelector("#pageNumbers");
const prevPageButton = document.querySelector("#prevPage");
const nextPageButton = document.querySelector("#nextPage");

let products = [];
let searchText = "";
let selectedCategory = "all";
let currentSort = "default";
let currentPage = 1;

const productsPerPage = 9;
const exchangeRate = 86;

let cart = [];
try {
    const savedCart = JSON.parse(
        localStorage.getItem("smartShopCartINR")
    );
    if (Array.isArray(savedCart)) {
        cart = savedCart
            .filter(function (item) {
                return (
                    item &&
                    Number.isFinite(Number(item.id)) &&
                    Number.isFinite(Number(item.price)) &&
                    Number(item.price) >= 0 &&
                    Number.isFinite(Number(item.quantity)) &&
                    Number(item.quantity) >= 1
                );
            })
            .map(function (item) {
                return {
                    id: Number(item.id),
                    title: String(item.title || "Product"),
                    price: Number(item.price),
                    thumbnail: String(item.thumbnail || ""),
                    quantity: Math.min(
                        99,
                        Math.floor(Number(item.quantity))
                    )
                };
            });
    }
} catch (error) {
    console.error("Cart data could not be loaded:", error);
    cart = [];
}

function convertToINR(price) {
    return Number(price) * exchangeRate;
}

function formatINR(price) {
    return Number(price || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR"
    });
}

function saveCart() {
    try {
        localStorage.setItem(
            "smartShopCartINR",
            JSON.stringify(cart)
        );
    } catch (error) {
        console.error("Cart could not be saved:", error);
    }
}

function updateCartCount() {
    const totalItems = cart.reduce(function (total, item) {
        return total + Number(item.quantity || 0);
    }, 0);

    if (cartLink) {
        cartLink.textContent = `Cart (${totalItems})`;
    }
}

function getFilteredProducts() {
    let filteredProducts = products.filter(function (product) {
        const title = String(product.title || "").toLowerCase();
        const description = String(product.description || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (currentSort === "price-asc") {
        filteredProducts.sort(function (a, b) {
            return a.price - b.price;
        });
    }

    if (currentSort === "price-desc") {
        filteredProducts.sort(function (a, b) {
            return b.price - a.price;
        });
    }

    if (currentSort === "rating-desc") {
        filteredProducts.sort(function (a, b) {
            return b.rating - a.rating;
        });
    }

    return filteredProducts;
}

function displayCategories() {
    if (!sidebarCategories) {
        return;
    }

    const categories = [...new Set(
        products.map(function (product) {
            return product.category;
        })
    )];

    sidebarCategories.innerHTML = `
        <li>
            <a href="#" data-category="all">
                All Products
            </a>
        </li>
    `;

    categories.forEach(function (category) {
        const categoryName = category
            .replace(/-/g, " ")
            .replace(/\b\w/g, function (letter) {
                return letter.toUpperCase();
            });

        sidebarCategories.innerHTML += `
            <li>
                <a href="#" data-category="${category}">
                    ${categoryName}
                </a>
            </li>
        `;
    });
}

function displayProducts() {
    if (!productsContainer) {
        return;
    }

    const filteredProducts = getFilteredProducts();

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProducts.length / productsPerPage)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * productsPerPage;

    const paginatedProducts = filteredProducts.slice(
        startIndex,
        startIndex + productsPerPage
    );

    productsContainer.innerHTML = "";

    if (productCount) {
        productCount.textContent =
            `Showing ${filteredProducts.length} products`;
    }

    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <p class="no-products">
                No products found.
            </p>
        `;

        displayPagination(totalPages);
        return;
    }

    paginatedProducts.forEach(function (product) {
        productsContainer.innerHTML += `
            <div class="product-card">
                <div class="product-img">
                    <img
                        src="${product.thumbnail}"
                        alt="${product.title}"
                        loading="lazy"
                    >
                </div>

                <div class="product-details">
                    <h3>${product.title}</h3>

                    <p class="product-description">
                        ${product.description}
                    </p>

                    <p class="product-price">
                        ${formatINR(convertToINR(product.price))}
                    </p>

                    <p class="product-category">
                        Category: ${product.category}
                    </p>

                    <p class="product-rating">
                        ⭐ ${product.rating}
                    </p>

                    <div class="product-quantity">
                        <button
                            type="button"
                            class="product-qty-btn"
                            data-action="decrease-qty"
                            data-id="${product.id}"
                        >
                            −
                        </button>

                        <input
                            type="number"
                            class="product-qty-input"
                            data-id="${product.id}"
                            value="1"
                            min="1"
                            max="99"
                        >

                        <button
                            type="button"
                            class="product-qty-btn"
                            data-action="increase-qty"
                            data-id="${product.id}"
                        >
                            +
                        </button>
                    </div>

                    <button
                        class="add-to-cart-btn"
                        data-id="${product.id}"
                        type="button"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });

    displayPagination(totalPages);
}

function displayPagination(totalPages) {
    if (!pagination || !pageNumbers) {
        return;
    }

    if (totalPages <= 1) {
        pagination.style.display = "none";
        return;
    }

    pagination.style.display = "flex";
    pageNumbers.innerHTML = "";

    // Current page se 3 page numbers show honge
    const startPage = currentPage;
    const endPage = Math.min(startPage + 2, totalPages);

    for (let page = startPage; page <= endPage; page++) {
        pageNumbers.innerHTML += `
            <button
                type="button"
                class="page-number ${page === currentPage ? "active" : ""}"
                data-page="${page}"
                ${page === currentPage ? 'aria-current="page"' : ""}
            >
                ${page}
            </button>
        `;
    }

    if (prevPageButton) {
        prevPageButton.disabled = currentPage === 1;
    }

    if (nextPageButton) {
        nextPageButton.disabled = currentPage === totalPages;
    }
}

if (prevPageButton) {
    prevPageButton.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            displayProducts();
        }
    });
}

if (nextPageButton) {
    nextPageButton.addEventListener("click", function () {
        const filteredProducts = getFilteredProducts();

        const totalPages = Math.ceil(
            filteredProducts.length / productsPerPage
        );

        if (currentPage < totalPages) {
            currentPage++;
            displayProducts();
            productsContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
}

if (pageNumbers) {
    pageNumbers.addEventListener("click", function (event) {
        const button = event.target.closest(".page-number");

        if (!button) {
            return;
        }

        currentPage = Number(button.dataset.page);
        displayProducts();
    });
}

if (productsContainer) {
    fetch("https://dummyjson.com/products?limit=100")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("API request failed");
            }

            return response.json();
        })
        .then(function (data) {
            products = data.products;

            displayCategories();
            displayProducts();
        })
        .catch(function (error) {
            productsContainer.innerHTML = `
                <p class="no-products">
                    Failed to load products. Please refresh the page.
                </p>
            `;

            console.error(error);
        });
}

if (productsContainer) {
    productsContainer.addEventListener("click", function (event) {
        const quantityButton = event.target.closest(".product-qty-btn");

        if (!quantityButton) {
            return;
        }

        const productId = Number(quantityButton.dataset.id);

        const quantityInput = productsContainer.querySelector(
            `.product-qty-input[data-id="${productId}"]`
        );

        if (!quantityInput) {
            return;
        }

        let quantity = Number(quantityInput.value) || 1;

        if (quantityButton.dataset.action === "increase-qty") {
            quantity++;
        }

        if (quantityButton.dataset.action === "decrease-qty") {
            quantity--;
        }

        quantity = Math.max(1, Math.min(99, quantity));
        quantityInput.value = quantity;
    });
}

if (productsContainer) {
    productsContainer.addEventListener("click", function (event) {
        const button = event.target.closest(".add-to-cart-btn");

        if (!button) {
            return;
        }

        const productId = Number(button.dataset.id);

        const selectedProduct = products.find(function (product) {
            return product.id === productId;
        });

        if (!selectedProduct) {
            return;
        }

        const quantityInput = productsContainer.querySelector(
            `.product-qty-input[data-id="${productId}"]`
        );

        let selectedQuantity = 1;

        if (quantityInput) {
            selectedQuantity = Number(quantityInput.value) || 1;
        }

        selectedQuantity = Math.max(
            1,
            Math.min(99, Math.floor(selectedQuantity))
        );

        const existingProduct = cart.find(function (item) {
            return item.id === productId;
        });

        if (existingProduct) {
            existingProduct.quantity = Math.min(
                99,
                Number(existingProduct.quantity) + selectedQuantity
            );
        } else {
            cart.push({
                id: selectedProduct.id,
                title: selectedProduct.title,
                price: convertToINR(selectedProduct.price),
                thumbnail: selectedProduct.thumbnail,
                quantity: selectedQuantity
            });
        }

        saveCart();
        updateCartCount();

        button.textContent = "Added ✓";
        button.classList.add("added");

        setTimeout(function () {
            button.textContent = "Add to Cart";
            button.classList.remove("added");
        }, 1000);
    });
}

if (searchForm && searchInput) {
    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        searchText = searchInput.value.trim().toLowerCase();
        currentPage = 1;

        displayProducts();
    });
}

if (sortSelect) {
    sortSelect.addEventListener("change", function () {
        currentSort = sortSelect.value;
        currentPage = 1;

        displayProducts();
    });
}
if (sidebarCategories) {
    sidebarCategories.addEventListener("click", function (event) {
        const link = event.target.closest("[data-category]");

        if (!link) {
            return;
        }

        event.preventDefault();

        selectedCategory = link.dataset.category
            .trim()
            .toLowerCase();

        currentPage = 1;

        displayProducts();
    });
}
const cartItems = document.querySelector("#cartItems");
const totalItemsElement = document.querySelector("#totalItems");
const subtotalElement = document.querySelector("#subtotal");
const deliveryElement = document.querySelector("#delivery");
const totalAmountElement = document.querySelector("#totalAmount");
const clearCartButton = document.querySelector("#clearCartBtn");
const checkoutButton = document.querySelector("#checkoutBtn");

function displayCart() {
    if (!cartItems) {
        return;
    }
    cartItems.innerHTML = "";
    let subtotal = 0;
    let totalItems = 0;
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <h2>Your Cart is Empty</h2>
                <p>Please add some products to your cart.</p>
                <a href="index.html">Continue Shopping</a>
            </div>
        `;
        if (totalItemsElement) {
            totalItemsElement.textContent = "0";
        }
        if (subtotalElement) {
            subtotalElement.textContent = formatINR(0);
        }
        if (deliveryElement) {
            deliveryElement.textContent = formatINR(0);
        }
        if (totalAmountElement) {
            totalAmountElement.textContent = formatINR(0);
        }
        if (checkoutButton) {
            checkoutButton.disabled = true;
        }
        updateCartCount();
        return;
    }
    cart.forEach(function (item) {
        const itemPrice = Number(item.price) || 0;
        const itemQuantity = Number(item.quantity) || 1;
        const itemTotal = itemPrice * itemQuantity;

        subtotal += itemTotal;
        totalItems += itemQuantity;

        cartItems.innerHTML += `
            <div class="cart-item">
                <img
                    src="${item.thumbnail}"
                    alt="${item.title}"
                    loading="lazy"
                >

                <div class="cart-item-details">
                    <h3>${item.title}</h3>

                    <p class="cart-item-price">
                        ${formatINR(itemPrice)}
                    </p>

                    <div class="cart-quantity">
                        <button
                            type="button"
                            data-action="decrease"
                            data-id="${item.id}"
                            ${itemQuantity <= 1 ? "disabled" : ""}
                        >
                            −
                        </button>

                        <span>${itemQuantity}</span>

                        <button
                            type="button"
                            data-action="increase"
                            data-id="${item.id}"
                            ${itemQuantity >= 99 ? "disabled" : ""}
                        >
                            +
                        </button>
                    </div>

                    <p>
                        Item Total:
                        <strong>${formatINR(itemTotal)}</strong>
                    </p>

                    <button
                        type="button"
                        class="remove-item-btn"
                        data-action="remove"
                        data-id="${item.id}"
                    >
                        Remove
                    </button>
                </div>
            </div>
        `;
    });

    let deliveryCharge = 0;

    if (subtotal > 0 && subtotal < 999) {
        deliveryCharge = 40;
    }

    const finalTotal = subtotal + deliveryCharge;

    if (totalItemsElement) {
        totalItemsElement.textContent = totalItems;
    }

    if (subtotalElement) {
        subtotalElement.textContent = formatINR(subtotal);
    }

    if (deliveryElement) {
        deliveryElement.textContent = formatINR(deliveryCharge);
    }

    if (totalAmountElement) {
        totalAmountElement.textContent = formatINR(finalTotal);
    }

    if (checkoutButton) {
        checkoutButton.disabled = false;
    }

    updateCartCount();
}

if (cartItems) {
    cartItems.addEventListener("click", function (event) {
        const button = event.target.closest("button");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const productId = Number(button.dataset.id);

        const product = cart.find(function (item) {
            return Number(item.id) === productId;
        });

        if (!product) {
            return;
        }

        if (action === "increase") {
            product.quantity = Math.min(
                99,
                Number(product.quantity) + 1
            );
        }

        if (action === "decrease") {
            product.quantity = Math.max(
                1,
                Number(product.quantity) - 1
            );
        }

        if (action === "remove") {
            cart = cart.filter(function (item) {
                return Number(item.id) !== productId;
            });
        }

        saveCart();
        displayCart();
    });
}

if (clearCartButton) {
    clearCartButton.addEventListener("click", function () {
        if (cart.length === 0) {
            return;
        }

        const confirmClear = confirm(
            "Are you sure you want to clear your cart?"
        );

        if (!confirmClear) {
            return;
        }

        cart = [];

        saveCart();
        displayCart();
        updateCartCount();
    });
}

if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        alert(
            "Your bill is ready! Online payment is not connected yet."
        );
    });
}

displayCart();
updateCartCount();
