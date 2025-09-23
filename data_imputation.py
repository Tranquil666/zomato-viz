import pandas as pd
import numpy as np

def impute_missing_services(df, original_services_df):
    """
    Imputes missing services data based on city-wise probabilities.

    For restaurants where no services are listed, this function calculates the probability
    of offering 'Table booking' and 'Online delivery' based on the statistics of
    other restaurants in the same city. It then uses these probabilities to randomly
    assign services to those restaurants.

    Args:
        df (pd.DataFrame): The original dataframe with restaurant data.

    Returns:
        pd.DataFrame: The dataframe with imputed services data.
    """
    print("Starting data imputation for missing services...")

    # Calculate city-wise probabilities for services
    city_probabilities = df.groupby('City').agg(
        prob_booking=('Has Table booking', 'mean'),
        prob_delivery=('Has Online delivery', 'mean')
    ).reset_index()

    # Identify rows where all service columns were originally NaN (truly missing)
    no_services_mask = original_services_df.isnull().all(axis=1)
    
    restaurants_to_impute = df[no_services_mask].copy()
    print(f"Found {len(restaurants_to_impute)} restaurants with no listed services to impute.")

    # Merge with probabilities
    restaurants_to_impute = restaurants_to_impute.merge(city_probabilities, on='City', how='left')

    # Fill NaN probabilities (for cities with no service data) with global mean
    global_prob_booking = df['Has Table booking'].mean()
    global_prob_delivery = df['Has Online delivery'].mean()
    restaurants_to_impute['prob_booking'].fillna(global_prob_booking, inplace=True)
    restaurants_to_impute['prob_delivery'].fillna(global_prob_delivery, inplace=True)

    # Apply probabilistic imputation
    # A service is assigned if a random number is less than the city's probability for that service
    imputed_booking = np.random.rand(len(restaurants_to_impute)) < restaurants_to_impute['prob_booking']
    imputed_delivery = np.random.rand(len(restaurants_to_impute)) < restaurants_to_impute['prob_delivery']

    # Update the original dataframe at the specific indices
    df.loc[restaurants_to_impute.index, 'Has Table booking'] = imputed_booking
    df.loc[restaurants_to_impute.index, 'Has Online delivery'] = imputed_delivery

    imputed_count = imputed_booking.sum() + imputed_delivery.sum()
    print(f"Successfully imputed approximately {imputed_count} new services across the dataset.")
    print("Data imputation complete.")

    return df
