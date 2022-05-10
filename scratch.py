for c in all_data.columns:
    print(f"{c}: {np.sum(all_data[c].isna())}")
    
