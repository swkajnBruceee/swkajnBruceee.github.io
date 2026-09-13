"""Bake real surface assets for the UMR teaching demo (not UMR training).

python build-models.py --human-dir /tmp/blog-umr-models --urdf /path/model.urdf
Requires numpy, scipy, trimesh==5.1.0, fast-simplification==0.2.0.
Human inputs: human-base.obj, default.mhskel, default_weights.mhw from the
MakeHuman commit recorded in assets/models.json. Download separately; no
network is needed by this converter or the blog's regular build.
"""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import trimesh
from scipy.spatial.transform import Rotation
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra

COMMIT = 'a8bc2d54ff0ac92e78ff71431b1023eda42bf482'
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'source/labs/umr/assets'


def human_mesh(directory):
    vertices, faces = [], []
    group = ''
    for line in (directory / 'human-base.obj').read_text().splitlines():
        words = line.split()
        if not words:
            continue
        if words[0] == 'v':
            vertices.append(list(map(float, words[1:4])))
        elif words[0] == 'g':
            group = words[1]
        elif words[0] == 'f' and group == 'body':
            ids = [int(s.split('/')[0]) - 1 for s in words[1:]]
            faces.extend([[ids[0], ids[i], ids[i + 1]] for i in range(1, len(ids) - 1)])
    vertices = np.array(vertices)
    rig = json.loads((directory / 'default.mhskel').read_text())
    weights = json.loads((directory / 'default_weights.mhw').read_text())['weights']
    bones = rig['bones']
    def joint(bone, end):
        return vertices[rig['joints'][bones[bone][end]]].mean(axis=0)
    transforms = {}
    # Rest-pose -> straight arms, using published skin weights. Each arm segment
    # is rotated rigidly; joint transitions follow linear blend skinning.
    for side, sign in [('L', 1), ('R', -1)]:
        shoulder = joint('upperarm01.' + side, 'head')
        elbow = joint('lowerarm01.' + side, 'head')
        wrist = joint('wrist.' + side, 'head')
        knuckle = joint('finger3-1.' + side, 'head')
        endpoint = shoulder.copy()
        for name, a, b in [('upper', shoulder, elbow), ('lower', elbow, wrist), ('hand', wrist, knuckle)]:
            direction = b - a
            rot = Rotation.align_vectors([[sign, 0, 0]], [direction / np.linalg.norm(direction)])[0].as_matrix()
            transforms[(name, side)] = (rot, endpoint - rot @ a)
            endpoint = endpoint + np.array([sign * np.linalg.norm(direction), 0, 0])
    posed = np.zeros_like(vertices)
    sums = np.zeros(len(vertices))
    labels = np.full(len(vertices), 'body', dtype=object)
    strongest = np.zeros(len(vertices))
    for name, entries in weights.items():
        side = name[-1]
        parent = name
        kind = None
        while parent:
            if parent.startswith('wrist.'):
                kind = 'hand'; break
            if parent.startswith('lowerarm'):
                kind = 'lower'; break
            if parent.startswith('upperarm'):
                kind = 'upper'; break
            parent = bones.get(parent, {}).get('parent')
        rot, shift = transforms.get((kind, side), (np.eye(3), np.zeros(3)))
        entries = np.array(entries)
        ids, w = entries[:, 0].astype(int), entries[:, 1]
        posed[ids] += (vertices[ids] @ rot.T + shift) * w[:, None]
        sums[ids] += w
        part = {'hand': 'palm', 'lower': 'forearm', 'upper': 'upper-arm'}.get(kind, 'body')
        chosen = w > strongest[ids]
        labels[ids[chosen]] = part
        strongest[ids[chosen]] = w[chosen]
    active = sums > 0
    posed[active] /= sums[active, None]
    posed[~active] = vertices[~active]
    # Keep only body faces; the OBJ also contains rig helpers and clothing cages.
    used, inverse = np.unique(np.array(faces), return_inverse=True)
    mesh = trimesh.Trimesh(posed[used], inverse.reshape(-1, 3), process=False)
    minimum, maximum = mesh.bounds
    height = maximum[1] - minimum[1]
    mesh.vertices = (mesh.vertices - [0, minimum[1], 0]) / height
    return mesh, labels[used], height / 10


def urdf_mesh(path):
    tree = ET.parse(path).getroot()
    links = {link.attrib['name']: link for link in tree.findall('link')}
    joints = tree.findall('joint')
    child_names = {j.find('child').get('link') for j in joints}
    root = next(k for k in links if k not in child_names)
    transforms = {root: np.eye(4)}
    pose = {'left_shoulder_roll_joint': np.pi / 2, 'right_shoulder_roll_joint': -np.pi / 2,
            'left_elbow_joint': np.pi / 2, 'right_elbow_joint': np.pi / 2}
    def origin(element):
        m = np.eye(4)
        if element is not None:
            m[:3, 3] = np.fromstring(element.get('xyz', '0 0 0'), sep=' ')
            m[:3, :3] = Rotation.from_euler('xyz', np.fromstring(element.get('rpy', '0 0 0'), sep=' ')).as_matrix()
        return m
    pending = list(joints)
    while pending:
        progressed = False
        for j in pending[:]:
            parent, child = j.find('parent').get('link'), j.find('child').get('link')
            if parent not in transforms:
                continue
            motion = np.eye(4)
            if j.get('name') in pose:
                angle = pose[j.get('name')]
                limit = j.find('limit')
                assert float(limit.get('lower')) <= angle <= float(limit.get('upper'))
                axis = np.fromstring(j.find('axis').get('xyz'), sep=' ')
                motion[:3, :3] = Rotation.from_rotvec(axis * angle).as_matrix()
            transforms[child] = transforms[parent] @ origin(j.find('origin')) @ motion
            pending.remove(j); progressed = True
        if not progressed:
            raise ValueError('URDF joint graph is disconnected')
    meshes, names, materials, hashes = [], [], [], {}
    for name, link in links.items():
        if name.startswith('imu_'):
            continue  # embedded sensor volumes are not the external body surface
        for visual in link.findall('visual'):
            resource = visual.find('geometry/mesh')
            mesh_path = (path.parent / resource.get('filename')).resolve()
            hashes[mesh_path.name] = hashlib.sha256(mesh_path.read_bytes()).hexdigest()
            mesh = trimesh.load_mesh(mesh_path, process=True)
            mesh.apply_scale(np.fromstring(resource.get('scale', '1 1 1'), sep=' '))
            mesh.apply_transform(transforms[name] @ origin(visual.find('origin')))
            # z-up, x-forward URDF -> y-up, z-forward display (proper rotation).
            mesh.vertices = mesh.vertices[:, [1, 2, 0]]
            original_faces = len(mesh.faces)
            target = min(original_faces, max(350, int(original_faces * .23)))
            if target < original_faces:
                mesh = mesh.simplify_quadric_decimation(face_count=target)
            meshes.append(mesh); names.append(name)
            rgba = np.fromstring(visual.find('material/color').get('rgba'), sep=' ')
            materials.append('shell' if rgba[0] > .5 else 'joint')
    height = max(m.bounds[1, 1] for m in meshes) - min(m.bounds[0, 1] for m in meshes)
    floor = min(m.bounds[0, 1] for m in meshes)
    for mesh in meshes:
        mesh.vertices = (mesh.vertices - [0, floor, 0]) / height
    return meshes, names, materials, pose, height, hashes


def surface_sample(mesh, count, seed):
    rng = np.random.default_rng(seed)
    # Farthest selection from area-proportional candidates limits visual clumps.
    # This is a sampling policy, independent of the optimization's repulsion term.
    face_ids = rng.choice(len(mesh.faces), size=count * 20, p=mesh.area_faces / mesh.area)
    u, v = rng.random((2, len(face_ids)))
    weights = np.stack([1 - np.sqrt(u), np.sqrt(u) * (1 - v), np.sqrt(u) * v], axis=1)
    candidates = (mesh.triangles[face_ids] * weights[:, :, None]).sum(axis=1)
    selected, distances, current = [], np.full(len(candidates), np.inf), 0
    for _ in range(count):
        selected.append(current)
        distances = np.minimum(distances, ((candidates - candidates[current]) ** 2).sum(axis=1))
        current = int(distances.argmax())
    selected = np.array(selected)
    return candidates[selected], face_ids[selected], weights[selected]


def geodesic_edges(mesh, points, faces):
    n = len(mesh.vertices)
    edges = mesh.edges_unique
    lengths = np.linalg.norm(mesh.vertices[edges[:, 0]] - mesh.vertices[edges[:, 1]], axis=1)
    sample_edges = np.stack([np.repeat(np.arange(len(points)) + n, 3), mesh.faces[faces].ravel()], axis=1)
    sample_lengths = np.linalg.norm(np.repeat(points, 3, axis=0) - mesh.vertices[sample_edges[:, 1]], axis=1)
    all_edges = np.concatenate([edges, sample_edges])
    all_lengths = np.concatenate([lengths, sample_lengths])
    graph = coo_matrix((np.tile(all_lengths, 2),
                        (np.concatenate([all_edges[:, 0], all_edges[:, 1]]),
                         np.concatenate([all_edges[:, 1], all_edges[:, 0]]))), shape=(n + len(points),) * 2).tocsr()
    distances = dijkstra(graph, indices=np.arange(len(points)) + n)[:, n:]
    np.fill_diagonal(distances, np.inf)
    result = set()
    for i in range(len(points)):
        for j in np.argsort(distances[i])[:6]:
            if np.isfinite(distances[i, j]):
                result.add(tuple(sorted([i, int(j)])))
    return sorted(result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--human-dir', type=Path, required=True)
    parser.add_argument('--urdf', type=Path, required=True)
    args = parser.parse_args()
    human, labels, human_height = human_mesh(args.human_dir)
    robot, names, materials, pose, robot_height, hashes = urdf_mesh(args.urdf)
    combined_robot = trimesh.util.concatenate(robot)
    source, source_faces, bary = surface_sample(human, 768, 20260913)
    target, target_faces, _ = surface_sample(combined_robot, 1152, 20260914)
    parts = labels[human.faces[source_faces, bary.argmax(axis=1)]]
    # A palm-facing patch on one hand: semantic display label only, never a loss.
    contact = np.where((parts == 'palm') & (source[:, 0] > 0) & (human.face_normals[source_faces, 2] > .15))[0]
    zoom = np.where((parts == 'forearm') & (source[:, 0] > 0))[0]
    edges = geodesic_edges(human, source, source_faces)
    blocks, chunks, offset = [], [], 0
    for mesh, name, material in [(human, 'MakeHuman hm08', 'human')] + list(zip(robot, names, materials)):
        record = {'name': name, 'material': material, 'vertices': len(mesh.vertices), 'triangles': len(mesh.faces)}
        for key, data in [('position', np.asarray(mesh.vertices, dtype='<f4')), ('normal', np.asarray(mesh.vertex_normals, dtype='<f4')), ('index', np.asarray(mesh.faces, dtype='<u4'))]:
            record[key] = offset
            chunk = data.tobytes(); chunks.append(chunk); offset += len(chunk)
        blocks.append(record)
    metadata = {'version': 1, 'humanCommit': COMMIT, 'urdf': 'agibot/URDF/a3_t2d5/urdf/model.urdf',
                'urdfSha256': hashlib.sha256(args.urdf.read_bytes()).hexdigest(), 'meshSha256': hashes,
                'poseRadians': pose, 'normalization': 'Each body independently normalized to unit height; no scale in metres in the loss.',
                'originalHeightMetres': {'human': human_height, 'robot': robot_height}, 'meshes': blocks}
    samples = {'source': source.round(7).tolist(), 'target': target.round(7).tolist(), 'edges': edges,
               'parts': parts.tolist(), 'contactIds': contact.tolist(), 'zoomIds': zoom.tolist(),
               'sourceFaces': source_faces.tolist(), 'sourceBarycentric': bary.round(7).tolist(), 'targetFaces': target_faces.tolist()}
    OUT.mkdir(exist_ok=True, parents=True)
    (OUT / 'surfaces.bin').write_bytes(b''.join(chunks))
    (OUT / 'models.json').write_text(json.dumps(metadata, indent=2) + '\n')
    (OUT / 'samples.json').write_text(json.dumps(samples, separators=(',', ':')) + '\n')
    print(json.dumps({'binaryBytes': offset, 'humanTriangles': len(human.faces), 'robotTriangles': len(combined_robot.faces),
                      'links': len(robot), 'sourcePoints': len(source), 'targetPoints': len(target), 'edges': len(edges),
                      'contactPoints': len(contact), 'forearmPoints': len(zoom), 'height': robot_height}, indent=2))


if __name__ == '__main__':
    main()
