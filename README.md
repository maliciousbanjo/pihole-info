# pihole-info

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

This module displays information from your running Pihole instance. It is a modified version of MMM-pihole-stats,
adapted to query on the serverside instead of the client side.

## Installation
 1. Clone this repo into `~/MagicMirror/modules` directory.
 2. Configure your `~/MagicMirror/config/config.js`:
 
     ```
     {
         module: 'pihole-info',
         position: 'bottom_right', // Or any valid MagicMirror position.
         config: {
             // See configuration options
         }
     }
     ```

## Configuration Options
| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `apiURL` | `http://pi.hole/admin/api.php` | Absolute URL to the Pi-Hole admin API |
| `showSources` | `true` | Show request sources |
| `showSourceHostnameOnly` | `true` | Only show hostname if applicable without showing IP address |
| `updateInterval` | `600000` | Time in ms to wait until updating |
| `retryDelay` | `2500` | Time in ms to wait before retry |
| `webpassword` |`""`| Needed to show sources, can be found in `/etc/pihole/setupVars.conf` on your pihole system.|