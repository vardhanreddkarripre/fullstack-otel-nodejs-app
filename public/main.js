// public/main.js
async function addToCart(productId) {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId })
    });
  
    const result = await res.json();
    if (result.success) {
      updateCart(result.cart);
    } else {
      alert('Failed to add item: ' + result.message);
    }
  }
  
  function updateCart(cart) {
    const cartList = document.getElementById('cart');
    cartList.innerHTML = '';
    cart.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - $${item.price}`;
      cartList.appendChild(li);
    });
  }
  