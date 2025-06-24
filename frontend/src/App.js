import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [flavors, setFlavors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchFlavors();
    fetchReviews();
  }, []);

  const fetchFlavors = async () => {
    try {
      const response = await axios.get(`${API}/flavors`);
      setFlavors(response.data);
    } catch (error) {
      console.error('Erro ao buscar sabores:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    }
  };

  const addToCart = (flavor) => {
    const existingItem = cart.find(item => item.flavor_name === flavor.name);
    if (existingItem) {
      setCart(cart.map(item => 
        item.flavor_name === flavor.name 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        flavor_name: flavor.name,
        quantity: 1,
        price: flavor.price
      }]);
    }
  };

  const removeFromCart = (flavorName) => {
    setCart(cart.filter(item => item.flavor_name !== flavorName));
  };

  const updateQuantity = (flavorName, quantity) => {
    if (quantity <= 0) {
      removeFromCart(flavorName);
    } else {
      setCart(cart.map(item => 
        item.flavor_name === flavorName 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || cart.length === 0) {
      alert('Por favor, preencha todos os campos e adicione itens ao pedido.');
      return;
    }

    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        items: cart,
        total_amount: calculateTotal(),
        notes: customerInfo.notes
      };

      await axios.post(`${API}/orders`, orderData);
      alert('Pedido realizado com sucesso!');
      setCart([]);
      setCustomerInfo({ name: '', phone: '', notes: '' });
      setCurrentView('home');
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      alert('Erro ao realizar pedido. Tente novamente.');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido.');
    }
  };

  const submitReview = async (reviewData) => {
    try {
      await axios.post(`${API}/reviews`, reviewData);
      fetchReviews();
      alert('Avaliação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Preparando': return 'bg-blue-100 text-blue-800';
      case 'Pronto': return 'bg-green-100 text-green-800';
      case 'Entregue': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">🥟 Pastelaria Delícias</h1>
          <p className="text-xl mb-8">Os melhores pastéis da cidade, feitos com amor e ingredientes frescos!</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setCurrentView('menu')}
              className="bg-white text-orange-500 px-8 py-3 rounded-full font-semibold hover:bg-orange-50 transition duration-300"
            >
              Ver Cardápio
            </button>
            <button 
              onClick={() => setCurrentView('reviews')}
              className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-orange-500 transition duration-300"
            >
              Avaliações
            </button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Sobre Nossa Pastelaria</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Há mais de 20 anos servindo os melhores pastéis da região! Nossa massa é feita diariamente 
            e nossos recheios são preparados com ingredientes selecionados. Venha experimentar nossos 
            sabores únicos e se apaixone pelo verdadeiro sabor do pastel brasileiro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-semibold mb-2">Sempre Fresquinho</h3>
            <p className="text-gray-600">Pastéis feitos na hora, quentinhos e crocantes</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🥘</div>
            <h3 className="text-xl font-semibold mb-2">10 Sabores</h3>
            <p className="text-gray-600">Variedade incrível de recheios para todos os gostos</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Entrega Rápida</h3>
            <p className="text-gray-600">Seu pedido fica pronto em poucos minutos</p>
          </div>
        </div>
      </div>

      {/* Reviews Preview */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">O que nossos clientes dizem</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xl ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-3">"{review.comment}"</p>
                <p className="font-semibold text-gray-800">- {review.customer_name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🥟 Nosso Cardápio</h1>
          <p className="text-lg text-gray-600">Escolha seus sabores favoritos e faça seu pedido!</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {flavors.map((flavor) => (
            <div key={flavor.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{flavor.name}</h3>
                <p className="text-gray-600 mb-4">{flavor.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">R$ {flavor.price.toFixed(2)}</span>
                  <button 
                    onClick={() => addToCart(flavor)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Seu Pedido</h3>
            {cart.map((item) => (
              <div key={item.flavor_name} className="flex justify-between items-center py-2 border-b">
                <span>{item.flavor_name}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQuantity(item.flavor_name, item.quantity - 1)}
                    className="bg-gray-200 px-2 py-1 rounded"
                  >-</button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.flavor_name, item.quantity + 1)}
                    className="bg-gray-200 px-2 py-1 rounded"
                  >+</button>
                  <span className="ml-4">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  <button 
                    onClick={() => removeFromCart(item.flavor_name)}
                    className="text-red-500 ml-2"
                  >×</button>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-xl font-bold">
                <span>Total: R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Form */}
        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Finalizar Pedido</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="border rounded-lg px-4 py-2"
              />
              <input
                type="tel"
                placeholder="Seu telefone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="border rounded-lg px-4 py-2"
              />
            </div>
            <textarea
              placeholder="Observações (opcional)"
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
              className="mt-4 w-full border rounded-lg px-4 py-2"
              rows="3"
            />
            <button 
              onClick={submitOrder}
              className="mt-4 w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition duration-200"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Admin page effect
  useEffect(() => {
    if (currentView === 'admin') {
      fetchOrders();
    }
  }, [currentView]);

  const renderAdmin = () => {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">Gestão de Pedidos</h1>
          
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{order.customer_name}</h3>
                    <p className="text-gray-600">{order.customer_phone}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-xl font-bold text-green-600 mt-2">
                      R$ {order.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Itens:</h4>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.flavor_name}</span>
                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-1">Observações:</h4>
                    <p className="text-gray-600">{order.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'Preparando')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Preparando
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'Pronto')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Pronto
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'Entregue')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Entregue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const [newReview, setNewReview] = useState({
    customer_name: '',
    rating: 5,
    comment: ''
  });

  const renderReviews = () => {
    const handleSubmitReview = (e) => {
      e.preventDefault();
      if (!newReview.customer_name || !newReview.comment) {
        alert('Por favor, preencha todos os campos.');
        return;
      }
      submitReview(newReview);
      setNewReview({ customer_name: '', rating: 5, comment: '' });
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">Avaliações dos Clientes</h1>
          
          {/* Add Review Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Deixe sua avaliação</h3>
            <form onSubmit={handleSubmitReview}>
              <input
                type="text"
                placeholder="Seu nome"
                value={newReview.customer_name}
                onChange={(e) => setNewReview({...newReview, customer_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2 mb-4"
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nota:</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewReview({...newReview, rating})}
                      className={`text-2xl ${rating <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Seu comentário"
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                className="w-full border rounded-lg px-4 py-2 mb-4"
                rows="4"
                required
              />
              <button 
                type="submit"
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
              >
                Enviar Avaliação
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="grid gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-lg">{review.customer_name}</h4>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{review.comment}</p>
                <p className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <button 
              onClick={() => setCurrentView('home')}
              className="text-2xl font-bold text-orange-500"
            >
              🥟 Pastelaria Delícias
            </button>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded ${currentView === 'home' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-orange-500'}`}
              >
                Início
              </button>
              <button 
                onClick={() => setCurrentView('menu')}
                className={`px-4 py-2 rounded ${currentView === 'menu' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-orange-500'}`}
              >
                Cardápio
              </button>
              <button 
                onClick={() => setCurrentView('reviews')}
                className={`px-4 py-2 rounded ${currentView === 'reviews' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-orange-500'}`}
              >
                Avaliações
              </button>
              <button 
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded ${currentView === 'admin' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-orange-500'}`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'home' && renderHome()}
      {currentView === 'menu' && renderMenu()}
      {currentView === 'admin' && renderAdmin()}
      {currentView === 'reviews' && renderReviews()}
    </div>
  );
}

export default App;