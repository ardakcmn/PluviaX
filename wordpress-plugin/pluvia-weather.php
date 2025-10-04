<?php
/**
 * Plugin Name: PluviaX Weather Assistant
 * Description: AI-powered weather assistant for your WordPress site
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue scripts and styles
function pluvia_enqueue_scripts() {
    wp_enqueue_script('pluvia-app', plugin_dir_url(__FILE__) . 'js/app.js', array(), '1.0.0', true);
    wp_enqueue_style('pluvia-styles', plugin_dir_url(__FILE__) . 'css/styles.css', array(), '1.0.0');
    
    // Localize script for AJAX
    wp_localize_script('pluvia-app', 'pluvia_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('pluvia_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'pluvia_enqueue_scripts');

// Shortcode for weather widget
function pluvia_weather_shortcode($atts) {
    $atts = shortcode_atts(array(
        'location' => '',
        'language' => 'tr'
    ), $atts);
    
    ob_start();
    ?>
    <div id="pluvia-weather-widget" data-location="<?php echo esc_attr($atts['location']); ?>" data-lang="<?php echo esc_attr($atts['language']); ?>">
        <!-- Weather widget will be loaded here -->
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('pluvia_weather', 'pluvia_weather_shortcode');

// AJAX handler for weather data
function pluvia_get_weather_data() {
    check_ajax_referer('pluvia_nonce', 'nonce');
    
    $lat = sanitize_text_field($_POST['lat']);
    $lon = sanitize_text_field($_POST['lon']);
    $date = sanitize_text_field($_POST['date']);
    
    // Call your weather API
    $response = wp_remote_post('https://your-pluvia-api.vercel.app/api/weather', array(
        'body' => json_encode(array(
            'lat' => $lat,
            'lon' => $lon,
            'date' => $date
        )),
        'headers' => array(
            'Content-Type' => 'application/json'
        )
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error('Weather data could not be retrieved');
    }
    
    $body = wp_remote_retrieve_body($response);
    wp_send_json_success(json_decode($body));
}
add_action('wp_ajax_pluvia_get_weather', 'pluvia_get_weather_data');
add_action('wp_ajax_nopriv_pluvia_get_weather', 'pluvia_get_weather_data');
