from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.sentiment import SentimentIntensityAnalyzer
import random
import json
import os
import re
import logging
from datetime import datetime
import string

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('vader_lexicon')

app = Flask(__name__)
CORS(app, origins=["https://zitharaproject-1.onrender.com"])  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize NLP tools
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))
sentiment_analyzer = SentimentIntensityAnalyzer()

# Load website structure data
website_structure = {
    "home": {
        "path": "/",
        "description": "The main page of our store featuring featured products and current promotions.",
        "aliases": ["main page", "homepage", "front page"]
    },
    "categories": {
        "path": "/categories",
        "description": "Browse all product categories including Electronics, Clothing, Kitchen, Accessories, Footwear, and Home.",
        "aliases": ["product categories", "browse categories", "all categories"]
    },
    "orders": {
        "path": "/orders",
        "description": "View your order history, track current orders, and manage returns.",
        "aliases": ["order history", "my orders", "purchase history", "order tracking"]
    },
    "wishlist": {
        "path": "/wishlist",
        "description": "Products you've saved for later. You can add items to your wishlist by clicking the heart icon on any product.",
        "aliases": ["saved items", "favorites", "saved for later"]
    },
    "deals": {
        "path": "/deals",
        "description": "Current promotions, discounts, and special offers available in our store.",
        "aliases": ["promotions", "discounts", "sales", "special offers"]
    },
    "account": {
        "path": "/account",
        "description": "Manage your account settings, personal information, payment methods, and preferences.",
        "aliases": ["profile", "my account", "settings", "personal info"]
    },
    "cart": {
        "path": "/cart",
        "description": "View and manage items in your shopping cart before checkout.",
        "aliases": ["shopping cart", "my cart", "checkout"]
    }
}

# Define product categories
product_categories = ["electronics", "clothing", "kitchen", "accessories", "footwear", "home"]

# Define intents and their patterns
intents = {
    "greeting": {
        "patterns": ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "howdy"],
        "responses": [
            "Hello! How can I help with your shopping today?",
            "Hi there! What are you looking for today?",
            "Hello! I'm your shopping assistant. How can I assist you?"
        ]
    },
    "goodbye": {
        "patterns": ["bye", "goodbye", "see you", "see you later", "talk to you later"],
        "responses": [
            "Goodbye! Have a great day!",
            "Thanks for shopping with us. Goodbye!",
            "See you next time!"
        ]
    },
    "thanks": {
        "patterns": ["thanks", "thank you", "appreciate it", "thanks a lot"],
        "responses": [
            "You're welcome!",
            "Happy to help!",
            "My pleasure!"
        ]
    },
    "help": {
        "patterns": ["help", "what can you do", "how do you work", "what are your features"],
        "responses": [
            "I can help you find products, navigate the website, add items to your cart, and answer questions about our store. Just ask!",
            "I'm your shopping assistant. I can search for products, provide information about our website sections, help with your cart, and more."
        ]
    },
    "find_product": {
        "patterns": ["find", "search for", "looking for", "show me", "do you have", "i need", "i want", "i'm looking for"],
        "context_required": True
    },
    "add_to_cart": {
        "patterns": ["add to cart", "buy", "purchase", "get", "i want to buy", "i want to purchase"],
        "context_required": True
    },
    "cart_status": {
        "patterns": ["what's in my cart", "show my cart", "cart contents", "items in cart", "what do i have in my cart"],
        "responses": [
            "I'll check your cart for you.",
            "Let me show you what's in your cart."
        ]
    },
    "navigation": {
        "patterns": ["go to", "open", "show me", "navigate to", "take me to", "i want to see"],
        "context_required": True
    },
    "product_info": {
        "patterns": ["tell me about", "details about", "information on", "specs for", "features of", "what can you tell me about"],
        "context_required": True
    },
    "order_status": {
        "patterns": ["where is my order", "order status", "track my order", "when will my order arrive", "my order"],
        "responses": [
            "I can help you check your order status. Please go to the Orders section to view your order history and tracking information.",
            "You can track your order in the Orders section. Would you like me to take you there?"
        ]
    },
    "shipping_info": {
        "patterns": ["shipping", "delivery", "how long does shipping take", "shipping cost", "free shipping", "when will it arrive"],
        "responses": [
            "We offer free standard shipping on all orders over $50. Standard shipping takes 3-5 business days. Express shipping is available for an additional fee and delivers within 1-2 business days.",
            "Our standard shipping takes 3-5 business days. Orders over $50 qualify for free shipping. Express shipping (1-2 days) is available for an additional fee."
        ]
    },
    "return_policy": {
        "patterns": ["return policy", "can I return", "how to return", "refund", "exchange", "i don't like my order"],
        "responses": [
            "Our return policy allows you to return items within 30 days of delivery for a full refund. Returns are free and can be initiated from the Orders section of your account.",
            "You can return any item within 30 days of delivery for a full refund. To start a return, go to the Orders section in your account."
        ]
    },
    "payment_methods": {
        "patterns": ["payment methods", "how can I pay", "do you accept", "credit card", "paypal", "how do i pay"],
        "responses": [
            "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay. All payment information is securely processed.",
            "You can pay using credit cards, PayPal, or Apple Pay. All transactions are secure and encrypted."
        ]
    },
    "section_inquiry": {
        "patterns": ["do you have", "is there", "where is", "how do i find", "can i find"],
        "context_required": True
    },
    "promo_code": {
        "patterns": ["promo code", "discount code", "coupon", "offer", "deal", "sale"],
        "responses": [
            "You can use the promo code 'WELCOME10' for 10% off your first order. We also have seasonal promotions in our Deals section.",
            "Try using the promo code 'WELCOME10' for 10% off your order. You can apply it during checkout."
        ]
    }
}

# User context management
user_contexts = {}

def preprocess_text(text):
    """Preprocess text by tokenizing, removing stop words, and lemmatizing"""
    # Remove punctuation
    text = text.lower().translate(str.maketrans('', '', string.punctuation))
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Remove stop words and lemmatize
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token.isalpha() and token not in stop_words]
    
    return tokens

def detect_intent(text):
    """Detect the user's intent from the text"""
    preprocessed_text = preprocess_text(text)
    text_lower = text.lower()
    
    # Check each intent
    matched_intents = []
    
    for intent_name, intent_data in intents.items():
        for pattern in intent_data.get("patterns", []):
            if pattern in text_lower:
                matched_intents.append((intent_name, text_lower.find(pattern)))
    
    # Sort by position of match (earlier matches take precedence)
    if matched_intents:
        matched_intents.sort(key=lambda x: x[1])
        return matched_intents[0][0]
    
    # Check for section inquiry patterns
    section_inquiry_patterns = ["do you have", "is there", "where is", "how do i find", "can i find"]
    for pattern in section_inquiry_patterns:
        if pattern in text_lower:
            for section in website_structure.keys():
                if section in text_lower or any(alias in text_lower for alias in website_structure[section]["aliases"]):
                    return "section_inquiry"
    
    # Check for product category mentions
    for category in product_categories:
        if category in text_lower:
            return "find_product"
    
    # Default to unknown intent
    return "unknown"

def extract_entities(text, intent):
    """Extract relevant entities based on the intent"""
    # Clean the text by removing trailing punctuation
    text_lower = text.lower().rstrip('.,!?;:')
    
    if intent == "find_product":
        # Extract product name or category
        for pattern in intents[intent]["patterns"]:
            if pattern in text_lower:
                entity = text_lower.split(pattern)[1].strip()
                return {"product_query": entity}
        
        # Check for direct category mentions
        for category in product_categories:
            if category in text_lower:
                return {"product_query": category}
    
    elif intent == "add_to_cart":
        # Extract product name
        for pattern in intents[intent]["patterns"]:
            if pattern in text_lower:
                entity = text_lower.split(pattern)[1].strip()
                return {"product_name": entity}
        
        # Handle simple "add" command
        if "add" in text_lower and not any(p in text_lower for p in intents[intent]["patterns"]):
            entity = text_lower.split("add")[1].strip()
            return {"product_name": entity}
    
    elif intent == "navigation":
        # Extract destination
        for pattern in intents[intent]["patterns"]:
            if pattern in text_lower:
                entity = text_lower.split(pattern)[1].strip()
                return {"destination": entity}
        
        # Direct navigation shortcuts
        direct_destinations = {
            "cart": "cart",
            "shopping cart": "cart",
            "my cart": "cart",
            "home": "home",
            "homepage": "home",
            "main page": "home",
            "categories": "categories",
            "category page": "categories",
            "orders": "orders",
            "my orders": "orders",
            "order history": "orders",
            "wishlist": "wishlist",
            "my wishlist": "wishlist",
            "saved items": "wishlist"
        }
        
        for key, value in direct_destinations.items():
            if key in text_lower:
                return {"destination": value}
    
    elif intent == "product_info":
        # Extract product name
        for pattern in intents[intent]["patterns"]:
            if pattern in text_lower:
                entity = text_lower.split(pattern)[1].strip()
                return {"product_name": entity}
    
    elif intent == "section_inquiry":
        # Extract section name
        for section, data in website_structure.items():
            if section in text_lower:
                return {"section": section}
            for alias in data["aliases"]:
                if alias in text_lower:
                    return {"section": section}
        
        # Check for specific section inquiries
        section_patterns = {
            "orders": ["order", "purchase history"],
            "wishlist": ["wishlist", "saved items", "favorites"],
            "cart": ["cart", "shopping cart"],
            "categories": ["categories", "product categories"],
            "account": ["account", "profile", "settings"]
        }
        
        for section, patterns in section_patterns.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return {"section": section}
    
    return {}

def analyze_sentiment(text):
    """Analyze the sentiment of the text"""
    sentiment_scores = sentiment_analyzer.polarity_scores(text)
    
    if sentiment_scores['compound'] >= 0.05:
        return "positive"
    elif sentiment_scores['compound'] <= -0.05:
        return "negative"
    else:
        return "neutral"

def get_response(intent, entities, user_id, products=None, cart=None):
    """Generate a response based on the intent and entities"""
    # Get user context
    user_context = user_contexts.get(user_id, {
        "last_products_shown": [],
        "last_intent": None,
        "conversation_history": [],
        "sentiment": "neutral"
    })
    
    # Analyze sentiment
    sentiment = analyze_sentiment(intent)
    user_context["sentiment"] = sentiment
    
    # Update user context
    user_context["last_intent"] = intent
    user_contexts[user_id] = user_context
    
    # Handle intents that don't require context
    if intent in ["greeting", "goodbye", "thanks", "help", "shipping_info", "return_policy", "payment_methods", "promo_code"]:
        return {
            "message": random.choice(intents[intent]["responses"]),
            "type": intent
        }
    
    # Handle intents that require context
    if intent == "find_product" and "product_query" in entities:
        query = entities["product_query"]
        
        # In a real implementation, this would search your product database
        # For now, we'll simulate finding products
        if products:
            matching_products = [p for p in products if 
                                query.lower() in p["name"].lower() or 
                                query.lower() in p["category"].lower() or
                                query.lower() in p["description"].lower()]
            
            if matching_products:
                # Update context with found products
                user_context["last_products_shown"] = matching_products[:3]
                
                return {
                    "message": f"I found {len(matching_products)} products matching '{query}'. Here are some options:",
                    "type": "product_results",
                    "products": matching_products[:3],
                    "action": f"search:{query}"
                }
            else:
                return {
                    "message": f"I couldn't find any products matching '{query}'. Would you like to try a different search term?",
                    "type": "no_results"
                }
        else:
            return {
                "message": f"I'll search for '{query}' products for you.",
                "type": "product_search",
                "action": f"search:{query}"
            }
    
    elif intent == "add_to_cart" and "product_name" in entities:
        product_name = entities["product_name"]
        
        # Check if we have products to search through
        if products:
            matching_product = next((p for p in products if product_name.lower() in p["name"].lower()), None)
            
            if matching_product:
                return {
                    "message": f"I've added {matching_product['name']} to your cart.",
                    "type": "add_to_cart_success",
                    "product": matching_product,
                    "action": f"addToCart:{matching_product['id']}"
                }
            else:
                return {
                    "message": f"I couldn't find a product called '{product_name}'. Would you like me to search for it?",
                    "type": "product_not_found",
                    "action": f"search:{product_name}"
                }
        else:
            return {
                "message": f"I'll add '{product_name}' to your cart if it's available.",
                "type": "add_to_cart_intent",
                "action": f"addToCart:{product_name}"
            }
    
    elif intent == "navigation" and "destination" in entities:
        destination = entities["destination"]
        
        # Check if destination matches any website section
        for section_name, section_data in website_structure.items():
            if destination.lower() == section_name.lower() or destination.lower() in [alias.lower() for alias in section_data["aliases"]]:
                return {
                    "message": f"Taking you to the {section_name} section. {section_data['description']}",
                    "type": "navigation",
                    "action": f"navigate:{section_data['path']}"
                }
        
        # Check if it's a product category
        for category in product_categories:
            if category.lower() in destination.lower():
                return {
                    "message": f"Showing you our {category} collection.",
                    "type": "category_navigation",
                    "action": f"category:{category}"
                }
        
        # Check if it might be a product
        if products:
            matching_product = next((p for p in products if destination.lower() in p["name"].lower()), None)
            if matching_product:
                return {
                    "message": f"Taking you to the {matching_product['name']} product page.",
                    "type": "product_navigation",
                    "action": f"navigate:/product/{matching_product['id']}"
                }
        
        return {
            "message": f"I'm not sure where '{destination}' is. You can navigate to Home, Categories, Orders, Wishlist, Deals, or Account.",
            "type": "navigation_error"
        }
    
    elif intent == "cart_status":
        if cart and len(cart) > 0:
            total = sum(item["price"] * item["quantity"] for item in cart)
            item_count = sum(item["quantity"] for item in cart)
            
            return {
                "message": f"You have {item_count} item{'s' if item_count != 1 else ''} in your cart with a total of ${total:.2f}. Would you like to checkout or continue shopping?",
                "type": "cart_status",
                "action": "suggestCheckout"
            }
        else:
            return {
                "message": "Your cart is currently empty. Would you like me to help you find some products?",
                "type": "empty_cart"
            }
    
    elif intent == "order_status":
        return {
            "message": random.choice(intents[intent]["responses"]),
            "type": intent,
            "action": "suggestNavigation:orders"
        }
    
    elif intent == "section_inquiry" and "section" in entities:
        section = entities["section"]
        section_data = website_structure.get(section)
        
        if section_data:
            return {
                "message": f"Yes, we have a {section.title()} section. {section_data['description']} Would you like me to take you there?",
                "type": "section_info",
                "action": f"suggestNavigation:{section}"
            }
        
        return {
            "message": f"I'm not sure about a section called '{section}'. Our main sections are Home, Categories, Orders, Wishlist, Deals, and Account.",
            "type": "section_unknown"
        }
    
    elif intent == "product_info" and "product_name" in entities:
        product_name = entities["product_name"]
        
        if products:
            matching_product = next((p for p in products if product_name.lower() in p["name"].lower()), None)
            
            if matching_product:
                price_info = f"${matching_product['price']:.2f}"
                if matching_product.get('discount'):
                    discounted_price = matching_product['price'] * (1 - matching_product['discount'] / 100)
                    price_info = f"${discounted_price:.2f} (${matching_product['price']:.2f} - {matching_product['discount']}% off)"
                
                return {
                    "message": f"{matching_product['name']}: {matching_product['description']} It costs {price_info} and has a rating of {matching_product.get('rating', 'N/A')} out of 5 stars. Would you like to see more details or add it to your cart?",
                    "type": "product_info",
                    "product": matching_product,
                    "action": f"showProduct:{matching_product['id']}"
                }
            else:
                return {
                    "message": f"I couldn't find information about '{product_name}'. Would you like me to search for similar products?",
                    "type": "product_not_found",
                    "action": f"search:{product_name}"
                }
        else:
            return {
                "message": f"I'll look up information about '{product_name}' for you.",
                "type": "product_info_intent"
            }
    
    # Handle unknown intent
    return {
        "message": "I'm not sure how to help with that. You can ask me to find products, navigate to different sections, add items to your cart, or get information about our website.",
        "type": "unknown"
    }

@app.route('/api/assistant', methods=['POST'])
def process_query():
    try:
        data = request.json
        query = data.get('query', '')
        products = data.get('products', [])
        cart = data.get('cart', [])
        user_id = data.get('user_id', 'anonymous')
        
        logger.info(f"Received query: {query}")
        
        # Process the query
        intent = detect_intent(query)
        entities = extract_entities(query, intent)
        
        logger.info(f"Detected intent: {intent}, entities: {entities}")
        
        # Generate response
        response = get_response(intent, entities, user_id, products, cart)
        
        # Add timestamp
        response['timestamp'] = datetime.now().isoformat()
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return jsonify({
            'error': 'Failed to process request',
            'message': 'I encountered an error processing your request. Please try again.'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'version': '1.0.0'})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
