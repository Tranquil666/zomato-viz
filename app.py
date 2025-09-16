import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
import os

# Page configuration
st.set_page_config(
    page_title="Zomato Analytics Dashboard",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for styling
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        color: white;
        text-align: center;
    }
    .stat-card {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        padding: 1.5rem;
        border-radius: 15px;
        color: white;
        text-align: center;
        margin: 0.5rem;
    }
    .metric-container {
        display: flex;
        justify-content: space-around;
        margin: 1rem 0;
    }
    .stSelectbox > div > div {
        background-color: #f8f9fa;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data():
    """Load and process the Zomato dataset"""
    try:
        # Try different encodings (latin-1 first as it's most likely to work)
        encodings = ['latin-1', 'utf-8', 'iso-8859-1', 'cp1252']
        df = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv('zomato.csv', encoding=encoding)
                st.success(f"Data loaded successfully using {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise Exception("Could not read CSV with any supported encoding")
        
        # Clean and process data
        df = df.dropna(subset=['Restaurant Name'])
        df['Restaurant Name'] = df['Restaurant Name'].fillna('Unknown')
        df['City'] = df['City'].fillna('Unknown')
        df['Cuisines'] = df['Cuisines'].fillna('Unknown')
        df['Aggregate rating'] = pd.to_numeric(df['Aggregate rating'], errors='coerce').fillna(0)
        df['Votes'] = pd.to_numeric(df['Votes'], errors='coerce').fillna(0)
        df['Average Cost for two'] = pd.to_numeric(df['Average Cost for two'], errors='coerce').fillna(0)
        df['Price range'] = pd.to_numeric(df['Price range'], errors='coerce').fillna(0)
        
        # Boolean columns
        df['Has Table booking'] = df['Has Table booking'].fillna('No').str.lower() == 'yes'
        df['Has Online delivery'] = df['Has Online delivery'].fillna('No').str.lower() == 'yes'
        df['Is delivering now'] = df['Is delivering now'].fillna('No').str.lower() == 'yes'
        
        return df
    except Exception as e:
        st.error(f"Error loading data: {e}")
        st.info("Please check that zomato.csv is in the same directory and is a valid CSV file")
        return pd.DataFrame()

def create_rating_chart(df):
    """Create rating distribution chart"""
    rating_ranges = {
        'Excellent (4.5+)': len(df[df['Aggregate rating'] >= 4.5]),
        'Very Good (4.0-4.4)': len(df[(df['Aggregate rating'] >= 4.0) & (df['Aggregate rating'] < 4.5)]),
        'Good (3.5-3.9)': len(df[(df['Aggregate rating'] >= 3.5) & (df['Aggregate rating'] < 4.0)]),
        'Average (3.0-3.4)': len(df[(df['Aggregate rating'] >= 3.0) & (df['Aggregate rating'] < 3.5)]),
        'Poor (<3.0)': len(df[df['Aggregate rating'] < 3.0])
    }
    
    fig = px.pie(
        values=list(rating_ranges.values()),
        names=list(rating_ranges.keys()),
        title="Rating Distribution",
        color_discrete_sequence=['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545']
    )
    fig.update_layout(height=400)
    return fig

def create_city_chart(df):
    """Create top cities chart"""
    city_counts = df['City'].value_counts().head(10)
    
    fig = px.bar(
        x=city_counts.values,
        y=city_counts.index,
        orientation='h',
        title="Top Cities by Restaurant Count",
        labels={'x': 'Number of Restaurants', 'y': 'City'},
        color=city_counts.values,
        color_continuous_scale='viridis'
    )
    fig.update_layout(height=400, yaxis={'categoryorder': 'total ascending'})
    return fig

def create_price_chart(df):
    """Create price range distribution chart"""
    price_labels = {1: 'Budget', 2: 'Affordable', 3: 'Mid-range', 4: 'Expensive'}
    price_counts = df['Price range'].value_counts().sort_index()
    
    fig = px.pie(
        values=price_counts.values,
        names=[price_labels.get(i, f'Range {i}') for i in price_counts.index],
        title="Price Range Distribution",
        color_discrete_sequence=['#28a745', '#ffc107', '#fd7e14', '#dc3545']
    )
    fig.update_layout(height=400)
    return fig

def create_cuisine_chart(df):
    """Create popular cuisines chart"""
    # Split cuisines and count
    all_cuisines = []
    for cuisines in df['Cuisines'].dropna():
        all_cuisines.extend([c.strip() for c in str(cuisines).split(',')])
    
    cuisine_counts = pd.Series(all_cuisines).value_counts().head(8)
    
    fig = px.bar(
        x=cuisine_counts.values,
        y=cuisine_counts.index,
        orientation='h',
        title="Popular Cuisines",
        labels={'x': 'Number of Restaurants', 'y': 'Cuisine'},
        color=cuisine_counts.values,
        color_continuous_scale='plasma'
    )
    fig.update_layout(height=400, yaxis={'categoryorder': 'total ascending'})
    return fig

def create_services_chart(df):
    """Create online services chart"""
    services_data = {
        'Table Booking': df['Has Table booking'].sum(),
        'Online Delivery': df['Has Online delivery'].sum(),
        'Currently Delivering': df['Is delivering now'].sum()
    }
    
    fig = px.bar(
        x=list(services_data.keys()),
        y=list(services_data.values()),
        title="Online Services Availability",
        labels={'x': 'Service Type', 'y': 'Number of Restaurants'},
        color=list(services_data.values()),
        color_continuous_scale='blues'
    )
    fig.update_layout(height=400)
    return fig

def create_cost_chart(df):
    """Create average cost by city chart"""
    cost_by_city = df[df['Average Cost for two'] > 0].groupby('City')['Average Cost for two'].mean().sort_values(ascending=False).head(8)
    
    fig = px.line(
        x=cost_by_city.index,
        y=cost_by_city.values,
        title="Average Cost by City",
        labels={'x': 'City', 'y': 'Average Cost for Two'},
        markers=True
    )
    fig.update_traces(line_color='#ff6b6b', marker_size=8)
    fig.update_layout(height=400)
    return fig

def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🍽️ Zomato Analytics Dashboard</h1>
        <p>Comprehensive restaurant data analysis and insights</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Check if CSV file exists
    if not os.path.exists('zomato.csv'):
        st.error("❌ zomato.csv file not found in the current directory.")
        st.info("Please ensure the CSV file is in the same folder as app.py")
        return
    
    # Load data
    df = load_data()
    
    if df.empty:
        st.error("No data available. Please check the CSV file format.")
        return
    
    # Sidebar filters
    st.sidebar.header("🔍 Filters")
    
    # City filter
    cities = ['All Cities'] + sorted(df['City'].unique().tolist())
    selected_city = st.sidebar.selectbox("Select City", cities)
    
    # Price range filter
    price_ranges = ['All Ranges', 'Budget (1)', 'Affordable (2)', 'Mid-range (3)', 'Expensive (4)']
    selected_price = st.sidebar.selectbox("Price Range", price_ranges)
    
    # Rating filter
    rating_options = ['Any Rating', '4.0+', '4.5+']
    selected_rating = st.sidebar.selectbox("Minimum Rating", rating_options)
    
    # Search filter
    search_term = st.sidebar.text_input("Search Restaurants", "")
    
    # Apply filters
    filtered_df = df.copy()
    
    if selected_city != 'All Cities':
        filtered_df = filtered_df[filtered_df['City'] == selected_city]
    
    if selected_price != 'All Ranges':
        price_map = {'Budget (1)': 1, 'Affordable (2)': 2, 'Mid-range (3)': 3, 'Expensive (4)': 4}
        filtered_df = filtered_df[filtered_df['Price range'] == price_map[selected_price]]
    
    if selected_rating != 'Any Rating':
        min_rating = float(selected_rating.replace('+', ''))
        filtered_df = filtered_df[filtered_df['Aggregate rating'] >= min_rating]
    
    if search_term:
        mask = (
            filtered_df['Restaurant Name'].str.contains(search_term, case=False, na=False) |
            filtered_df['Cuisines'].str.contains(search_term, case=False, na=False) |
            filtered_df['City'].str.contains(search_term, case=False, na=False)
        )
        filtered_df = filtered_df[mask]
    
    # Reset filters button
    if st.sidebar.button("🔄 Reset Filters"):
        st.experimental_rerun()
    
    # Key metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Restaurants", f"{len(filtered_df):,}")
    
    with col2:
        avg_rating = filtered_df[filtered_df['Aggregate rating'] > 0]['Aggregate rating'].mean()
        st.metric("Average Rating", f"{avg_rating:.1f}" if not pd.isna(avg_rating) else "N/A")
    
    with col3:
        unique_cities = filtered_df['City'].nunique()
        st.metric("Cities", f"{unique_cities}")
    
    # Charts section
    st.header("📊 Analytics Dashboard")
    
    # First row of charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.plotly_chart(create_rating_chart(filtered_df), use_container_width=True)
    
    with col2:
        st.plotly_chart(create_city_chart(filtered_df), use_container_width=True)
    
    # Second row of charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.plotly_chart(create_price_chart(filtered_df), use_container_width=True)
    
    with col2:
        st.plotly_chart(create_cuisine_chart(filtered_df), use_container_width=True)
    
    # Third row of charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.plotly_chart(create_services_chart(filtered_df), use_container_width=True)
    
    with col2:
        st.plotly_chart(create_cost_chart(filtered_df), use_container_width=True)
    
    # Restaurant table
    st.header("🏪 Restaurant Details")
    
    # Table controls
    col1, col2 = st.columns([3, 1])
    
    with col2:
        sort_options = ['Rating', 'Votes', 'Cost', 'Name']
        sort_by = st.selectbox("Sort by", sort_options)
    
    # Sort data
    sort_mapping = {
        'Rating': 'Aggregate rating',
        'Votes': 'Votes', 
        'Cost': 'Average Cost for two',
        'Name': 'Restaurant Name'
    }
    
    if sort_by in ['Rating', 'Votes', 'Cost']:
        display_df = filtered_df.sort_values(sort_mapping[sort_by], ascending=False)
    else:
        display_df = filtered_df.sort_values(sort_mapping[sort_by])
    
    # Display table
    if len(display_df) > 0:
        # Prepare display columns
        table_df = display_df[[
            'Restaurant Name', 'City', 'Cuisines', 'Aggregate rating', 
            'Votes', 'Average Cost for two', 'Has Table booking', 
            'Has Online delivery', 'Is delivering now'
        ]].head(50).copy()
        
        # Format columns
        table_df['Rating'] = table_df['Aggregate rating'].apply(lambda x: f"{x:.1f} ⭐" if x > 0 else "N/A")
        table_df['Cost'] = table_df['Average Cost for two'].apply(lambda x: f"{x:,.0f}" if x > 0 else "N/A")
        table_df['Services'] = table_df.apply(lambda row: 
            "📅" if row['Has Table booking'] else "" +
            "🚚" if row['Has Online delivery'] else "" +
            "🟢" if row['Is delivering now'] else "" or "None", axis=1)
        
        # Select final columns for display
        final_df = table_df[['Restaurant Name', 'City', 'Cuisines', 'Rating', 'Votes', 'Cost', 'Services']]
        
        st.dataframe(final_df, use_container_width=True, height=400)
        
        if len(display_df) > 50:
            st.info(f"Showing first 50 of {len(display_df)} results")
    else:
        st.warning("No restaurants found matching the current filters.")

if __name__ == "__main__":
    main()