import argparse
import git
import json
import logging
import os
import re
import sys
import time
from zipfile import ZipFile

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(name)s - %(message)s')
logger = logging.getLogger(__name__ if __name__ != '__main__' else 'main')

def commit(repo, version):
    """
    Commit changes in the repo given.
    """
    repo.git.add('.')
    repo.git.commit( m="Update created @ {}".format(version) )
    logger.info('Commited successfully')

def tag(repo, version, message=""):
    """
    Tag last commit in the repo given.
    """
    repo.create_tag(version, message=message)
    logger.info('Tag created @ {}'.format(version))

def push(repo, version):
    """
    Push changes and the corresponding tag to the origin remote.
    """
    origin = repo.remote(name='origin')
    origin.push("master")
    logger.info('Changes pushed at {}/master'.format(origin))
    origin.push(version)
    logger.info('Tag {} pushed at {}/master'.format(version, origin))

def makezip(version):
    """
    Make a zip with the necessary files and folder.
    """
    logger.info('Making zip file')
    zipname = 'releases/upm-mean_{}.zip'.format(version)
    object = ZipFile(zipname, 'w')
    # Folders and files to include
    folders = ['html', 'icons', 'scripts', 'styles']
    files = ['LICENSE', 'manifest.json', 'updates.json']
    for folder in folders:
        for root, subfolder, filenames in os.walk(folder):
            for filename in filenames:
                logger.info('Writing into zip {}'.format(os.path.join(root, filename)))
                object.write(os.path.join(root, filename))
    for filename in files:
        logger.info('Writing {} into zip'.format(filename))
        object.write(filename)
    logger.info('Zip file created @ {}'.format(zipname))

def manifest(version):
    """
    Update manifest.json version key.
    """
    with open('manifest.json', 'r+') as f:
        logger.info('Updating manifest.json to v{}'.format(version))
        manifest = json.load(f)
        manifest.update({ 'version': version })
        f.seek(0)
        json.dump(manifest, f, indent=2)

def updatesURL(version):
    """
    Update the updates.json with the corresponding URL.
    """
    with open('updates.json', 'r+') as f:
        logger.info('Updating updates.json to load v{}'.format(version))
        updates = json.load(f)
        current = {
                    "version": version,
                    "update_link": "https://github.com/tasiomendez/mean-upm/releases/download/v{}/mean-upm-firefox_v{}-fx.xpi".format(version, version)
                  }
        updates['addons']['{0f56a2f6-587d-4454-9e58-6b891b474372}']['updates'].append(current)
        f.seek(0)
        json.dump(updates, f, indent=2)

def confirm():
    """
    Ask user to enter Y or N (case-insensitive).
    Return True if the answer is Y.
    """
    answer = input("OK to push to continue [y/N]? ").lower()
    return answer == "y" or answer == "Y" or answer == "yes"

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Automatize the steps for creating a new version of the addon')
    parser.add_argument('version', help='version to create as 1.3.0')
    parser.add_argument('--message', help='tag message', default='', required=True)
    parser.add_argument('--push', help='push changes to origin', action='store_true')

    args = parser.parse_args()

    # Get only the number of the version
    version = re.search(r'\s*([\d.]+)', args.version).group(1)
    vversion = "v{}".format(version)
    logger.info('Version to upgrade @ v{}'.format(version))
    if (not confirm()):
        sys.exit(0)

    logger.info('Tagging commit with message: {}'.format(args.message))
    if (not confirm()):
        sys.exit(0)

    repo = git.Repo( os.getcwd() )
    # Updates updates.json
    updatesURL(version)
    # Updates manifest.json
    manifest(version)
    # Make zip
    makezip(vversion)
    # Commit changes and public tag
    commit(repo, vversion)
    tag(repo, vversion, args.message)
    # Push changes to origin/master
    if (args.push):
        push(repo, vversion)
