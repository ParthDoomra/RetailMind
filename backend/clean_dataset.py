import pandas as pd

# Load merged file
df = pd.read_csv("combined_products.csv", low_memory=False)

# Create clean dataframe
clean = pd.DataFrame()

# Product Name
clean["product_name"] = df["product_name"].fillna(df["name"])

# Brand
clean["brand"] = df["Brand"]

# Category
clean["category"] = df["category"]

# Price
clean["price"] = df["price"].fillna(df["Selling Price"]).fillna(df["discounted_price"])

# Rating
clean["rating"] = df["rating"].fillna(df["Rating"])

# Image
clean["image_url"] = df["img_link"].fillna(df["img"])

# Description
clean["description"] = df["about_product"].fillna(df["Description"])

# Source
clean["source"] = df["source"]

# Remove blank names
clean.dropna(subset=["product_name"], inplace=True)

# Remove duplicates
clean.drop_duplicates(subset=["product_name"], inplace=True)

# Save
clean.to_csv("retailmind_master.csv", index=False)

print("✅ Clean dataset ready")
print(clean.head())
print("Rows:", len(clean))