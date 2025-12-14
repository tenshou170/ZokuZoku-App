import os
import glob
from pathlib import Path

# Common Linux Steam Library paths
STEAM_PATHS = [
    os.path.expanduser("~/.steam/steam"),
    os.path.expanduser("~/.local/share/Steam"),
    os.path.expanduser("~/.var/app/com.valvesoftware.Steam/data/Steam") # Flatpak
]

APP_IDS = {
    "JP": "3564400",
    "Global": "3224770"
}

GAME_DIR_NAMES = [
    "UmamusumePrettyDerby", # Common
]

def find_game_install_path():
    """
    Attempts to find the game installation path on Linux.
    Returns the path to the 'UmamusumePrettyDerby' directory.
    """
    # 1. Check strict known paths
    candidate_paths = []
    
    for steam_root in STEAM_PATHS:
        apps_path = os.path.join(steam_root, "steamapps", "common")
        if os.path.exists(apps_path):
            for name in GAME_DIR_NAMES:
                full_path = os.path.join(apps_path, name)
                if os.path.exists(full_path):
                    return full_path

    return None

def find_story_data_dir(game_path):
    """
    Finds the directory containing story data within the game path.
    Supports both native structure (Persistent/) and extracted structure.
    """
    # 1. Native Structure: Check if the path itself is the 'Persistent' folder (contains master/master.mdb)
    if os.path.exists(os.path.join(game_path, "master", "master.mdb")):
        return game_path
        
    # 2. Native Structure: Check if path is Game Root (contains UmamusumePrettyDerby_Jpn_Data/Persistent)
    persistent_check = os.path.join(game_path, "UmamusumePrettyDerby_Jpn_Data", "Persistent")
    if os.path.exists(os.path.join(persistent_check, "master", "master.mdb")):
        return persistent_check

    # 3. Extracted/Deep Structure (Legacy/Mock)
    # Standard path: .../UmamusumePrettyDerby_Jpn_Data/Persistent/assets/_gallopresources/bundle/resources/story/data
    jp_path = os.path.join(game_path, "UmamusumePrettyDerby_Jpn_Data", "Persistent", "assets", "_gallopresources", "bundle", "resources", "story", "data")
    if os.path.exists(jp_path):
        return jp_path
        
    return None

def list_stories(story_base_dir):
    """
    Scans the story data directory and returns a tree or list of available stories.
    Returns a simplified list of files for now: [{"id": "020001004", "path": "...", "category": "02", "group": "0001"}]
    """
    stories = []
    
    # Check for native Game structure
    # Expected: .../Persistent/master/master.mdb
    master_path = os.path.join(story_base_dir, "master", "master.mdb")
    
    if os.path.exists(master_path):
        # We need to query the DB for story timeline entries
        # This requires APSW which is in our requirements.
        # We can use py_bridge logic to query it.
        import py_bridge
        
        # Query to find main story chapters (simplistic example)
        # story_data table usually contains the mapping.
        # Let's try to find stories from `text_data` or `story_timeline` related tables?
        # Actually proper logic is complex. For a "Shell", let's just list what we can cheaply.
        # But if we can't query, we can't list.
        
        # Fallback: Just look for 'storytimeline' in the `dat` if they are unpacked?
        # No, they are hashed.
        
        try:
            # Query MAIN STORIES
            # Table: main_story_data
            # Columns: story_id_1 (Timeline ID), part_id (Group), story_number, id (Episode ID)
            # We filter for story_id_1 > 0 to get actual story scripts.
            res = py_bridge.handle_query_db({
                "db_path": master_path,
                "query": "SELECT story_id_1, part_id, story_number, id FROM main_story_data WHERE story_id_1 > 0 LIMIT 200", 
                "key": None
            })
            
            # If successful, parse rows
            if res and 'rows' in res:
                for row in res['rows']:
                    # row: [story_id_1, part_id, story_number, episode_id]
                    story_id = str(row[0])
                    part_id = str(row[1])
                    episode_id = str(row[3])
                    
                    stories.append({
                        "id": story_id,
                        "path": f"native://{story_id}", # Placeholder for native loading
                        "rel_path": f"Main/Part{part_id}/Ep{episode_id}",
                        "category": "Main",
                        "group": f"Part {part_id}"
                    })
        except Exception as e:
            print(f"Failed to query master.mdb: {e}")
            # Silently fail or log, don't break the UI with error items for now? 
            # Or keep error item if really busted.
            # Let's just print to console, as we want to fallback to glob if this fails.

            
    # Also continue to glob for JSONs (extracted mode)
    search_pattern = os.path.join(story_base_dir, "**", "storytimeline_*.json")
    files = glob.glob(search_pattern, recursive=True)
    
    for f in files:
        rel_path = os.path.relpath(f, story_base_dir)
        parts = rel_path.split(os.sep)
        
        if len(parts) >= 3:
            category = parts[0]
            group = parts[1]
            filename = parts[-1]
            story_id = filename.replace("storytimeline_", "").replace(".json", "")
            
            stories.append({
                "id": story_id,
                "path": f,
                "rel_path": rel_path,
                "category": category,
                "group": group
            })
            
    return stories
