import pandas as pd

def test_csv_loading():
    """Test loading CSV with different encodings"""
    file_path = 'zomato.csv'
    
    encodings_to_try = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'utf-16']
    
    for encoding in encodings_to_try:
        if encoding is None:
            continue
            
        try:
            print(f"\n📝 Trying encoding: {encoding}")
            df = pd.read_csv(file_path, encoding=encoding)
            print(f"✅ Success! Loaded {len(df)} rows with {encoding}")
            print(f"Columns: {list(df.columns)}")
            print(f"First few restaurant names: {df['Restaurant Name'].head(3).tolist()}")
            break
        except Exception as e:
            print(f"❌ Failed with {encoding}: {str(e)[:100]}...")

if __name__ == "__main__":
    test_csv_loading()