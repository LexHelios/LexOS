import io
import logging
from typing import Dict, List, Optional, Tuple, Union

import folium
import geopandas as gpd
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap
from PIL import Image
from shapely.geometry import Point, Polygon

logger = logging.getLogger(__name__)

def create_choropleth_map(
    gdf: gpd.GeoDataFrame,
    column: str,
    title: str = "Choropleth Map",
    color_scheme: str = "viridis",
    bins: int = 5,
    legend_title: Optional[str] = None,
    **kwargs
) -> folium.Map:
    """
    Create a choropleth map using Folium.
    
    Args:
        gdf: Input GeoDataFrame
        column: Column to use for coloring
        title: Map title
        color_scheme: Color scheme name
        bins: Number of bins for color classification
        legend_title: Title for the legend
        **kwargs: Additional arguments for folium.Choropleth
    
    Returns:
        Folium map object
    """
    try:
        # Create base map
        m = folium.Map(
            location=[gdf.geometry.centroid.y.mean(), gdf.geometry.centroid.x.mean()],
            zoom_start=10,
            tiles='CartoDB positron'
        )
        
        # Add choropleth layer
        folium.Choropleth(
            geo_data=gdf.__geo_interface__,
            name='choropleth',
            data=gdf,
            columns=['id', column],
            key_on='feature.id',
            fill_color=color_scheme,
            fill_opacity=0.7,
            line_opacity=0.2,
            legend_name=legend_title or column,
            bins=bins,
            **kwargs
        ).add_to(m)
        
        # Add layer control
        folium.LayerControl().add_to(m)
        
        return m
    except Exception as e:
        logger.error(f"Failed to create choropleth map: {str(e)}")
        raise

def create_heatmap(
    gdf: gpd.GeoDataFrame,
    intensity_column: Optional[str] = None,
    radius: int = 15,
    blur: int = 10,
    max_zoom: int = 10,
    **kwargs
) -> folium.Map:
    """
    Create a heatmap using Folium.
    
    Args:
        gdf: Input GeoDataFrame with point geometries
        intensity_column: Column to use for heat intensity
        radius: Radius of influence for each point
        blur: Blur factor for the heatmap
        max_zoom: Maximum zoom level
        **kwargs: Additional arguments for folium.HeatMap
    
    Returns:
        Folium map object
    """
    try:
        # Create base map
        m = folium.Map(
            location=[gdf.geometry.centroid.y.mean(), gdf.geometry.centroid.x.mean()],
            zoom_start=10,
            tiles='CartoDB positron'
        )
        
        # Prepare heatmap data
        heat_data = []
        for idx, row in gdf.iterrows():
            point = row.geometry
            if isinstance(point, Point):
                if intensity_column:
                    heat_data.append([point.y, point.x, row[intensity_column]])
                else:
                    heat_data.append([point.y, point.x, 1])
        
        # Add heatmap layer
        folium.HeatMap(
            heat_data,
            radius=radius,
            blur=blur,
            max_zoom=max_zoom,
            **kwargs
        ).add_to(m)
        
        return m
    except Exception as e:
        logger.error(f"Failed to create heatmap: {str(e)}")
        raise

def create_scatter_plot(
    gdf: gpd.GeoDataFrame,
    x_column: str,
    y_column: str,
    color_column: Optional[str] = None,
    size_column: Optional[str] = None,
    title: str = "Scatter Plot",
    **kwargs
) -> plt.Figure:
    """
    Create a scatter plot using Matplotlib.
    
    Args:
        gdf: Input GeoDataFrame
        x_column: Column to use for x-axis
        y_column: Column to use for y-axis
        color_column: Column to use for point colors
        size_column: Column to use for point sizes
        title: Plot title
        **kwargs: Additional arguments for plt.scatter
    
    Returns:
        Matplotlib figure object
    """
    try:
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # Create scatter plot
        scatter = ax.scatter(
            gdf[x_column],
            gdf[y_column],
            c=gdf[color_column] if color_column else None,
            s=gdf[size_column] if size_column else 50,
            **kwargs
        )
        
        # Add colorbar if color_column is provided
        if color_column:
            plt.colorbar(scatter, label=color_column)
        
        # Customize plot
        ax.set_title(title)
        ax.set_xlabel(x_column)
        ax.set_ylabel(y_column)
        ax.grid(True)
        
        return fig
    except Exception as e:
        logger.error(f"Failed to create scatter plot: {str(e)}")
        raise

def create_histogram(
    gdf: gpd.GeoDataFrame,
    column: str,
    bins: int = 30,
    title: str = "Histogram",
    **kwargs
) -> plt.Figure:
    """
    Create a histogram using Matplotlib.
    
    Args:
        gdf: Input GeoDataFrame
        column: Column to plot
        bins: Number of bins
        title: Plot title
        **kwargs: Additional arguments for plt.hist
    
    Returns:
        Matplotlib figure object
    """
    try:
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Create histogram
        ax.hist(gdf[column], bins=bins, **kwargs)
        
        # Customize plot
        ax.set_title(title)
        ax.set_xlabel(column)
        ax.set_ylabel("Frequency")
        ax.grid(True)
        
        return fig
    except Exception as e:
        logger.error(f"Failed to create histogram: {str(e)}")
        raise

def save_map_to_image(
    m: folium.Map,
    output_path: str,
    width: int = 1200,
    height: int = 800
) -> None:
    """
    Save a Folium map as an image.
    
    Args:
        m: Folium map object
        output_path: Path to save the image
        width: Image width in pixels
        height: Image height in pixels
    """
    try:
        # Save map to temporary HTML file
        temp_html = "temp_map.html"
        m.save(temp_html)
        
        # Use Selenium to render the map
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument(f"--window-size={width},{height}")
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.get(f"file://{temp_html}")
        
        # Wait for map to load
        import time
        time.sleep(2)
        
        # Take screenshot
        driver.save_screenshot(output_path)
        driver.quit()
        
        # Clean up temporary file
        import os
        os.remove(temp_html)
    except Exception as e:
        logger.error(f"Failed to save map to image: {str(e)}")
        raise

def create_custom_colormap(
    colors: List[str],
    name: str = "custom"
) -> LinearSegmentedColormap:
    """
    Create a custom colormap.
    
    Args:
        colors: List of color names or hex codes
        name: Name for the colormap
    
    Returns:
        Custom LinearSegmentedColormap
    """
    try:
        return LinearSegmentedColormap.from_list(name, colors)
    except Exception as e:
        logger.error(f"Failed to create custom colormap: {str(e)}")
        raise

def add_map_controls(
    m: folium.Map,
    draw_options: Optional[Dict] = None,
    measure_options: Optional[Dict] = None,
    **kwargs
) -> folium.Map:
    """
    Add drawing and measurement controls to a Folium map.
    
    Args:
        m: Folium map object
        draw_options: Options for drawing control
        measure_options: Options for measurement control
        **kwargs: Additional arguments for controls
    
    Returns:
        Updated Folium map object
    """
    try:
        # Add drawing control
        if draw_options is not None:
            from folium.plugins import Draw
            Draw(
                export=True,
                **draw_options,
                **kwargs
            ).add_to(m)
        
        # Add measurement control
        if measure_options is not None:
            from folium.plugins import MeasureControl
            MeasureControl(
                **measure_options,
                **kwargs
            ).add_to(m)
        
        return m
    except Exception as e:
        logger.error(f"Failed to add map controls: {str(e)}")
        raise 