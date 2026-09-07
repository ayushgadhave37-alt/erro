#include "graph.h"
#include <stdio.h>

void init_graph(Graph* g, int num_nodes) {
    g->node_count = num_nodes;
    for (int i = 0; i < num_nodes; i++) {
        g->nodes[i].id = i;
        g->nodes[i].edge_count = 0;
    }
}

void add_edge(Graph* g, int source, int target, float weight) {
    if (source >= g->node_count || target >= g->node_count) return;
    
    // Add forward edge
    int count = g->nodes[source].edge_count;
    g->nodes[source].edges[count].target = target;
    g->nodes[source].edges[count].weight = weight;
    g->nodes[source].edge_count++;
    
    // Add reverse edge (undirected graph)
    int rcount = g->nodes[target].edge_count;
    g->nodes[target].edges[rcount].target = source;
    g->nodes[target].edges[rcount].weight = weight;
    g->nodes[target].edge_count++;
}

// Returns the number of nodes in the path, stores path in path_out
int find_shortest_path(Graph* g, int start_node, int end_node, int* path_out, float* distance_out) {
    float dist[MAX_NODES];
    int prev[MAX_NODES];
    int visited[MAX_NODES];

    for (int i = 0; i < g->node_count; i++) {
        dist[i] = INF;
        prev[i] = -1;
        visited[i] = 0;
    }

    dist[start_node] = 0.0f;

    for (int count = 0; count < g->node_count - 1; count++) {
        // Pick min distance node
        float min = INF;
        int min_index = -1;
        for (int v = 0; v < g->node_count; v++) {
            if (visited[v] == 0 && dist[v] <= min) {
                min = dist[v];
                min_index = v;
            }
        }
        
        if (min_index == -1) break;
        visited[min_index] = 1;

        if (min_index == end_node) break; // early exit

        // Update neighbors
        Node* u = &g->nodes[min_index];
        for (int i = 0; i < u->edge_count; i++) {
            int v = u->edges[i].target;
            float weight = u->edges[i].weight;
            if (!visited[v] && dist[min_index] != INF && dist[min_index] + weight < dist[v]) {
                dist[v] = dist[min_index] + weight;
                prev[v] = min_index;
            }
        }
    }

    *distance_out = dist[end_node];

    // Reconstruct path backwards
    if (dist[end_node] == INF) {
        return 0; // No path found
    }

    int temp_path[MAX_NODES];
    int current = end_node;
    int path_len = 0;

    while (current != -1) {
        temp_path[path_len++] = current;
        current = prev[current];
    }

    // Reverse into path_out
    for (int i = 0; i < path_len; i++) {
        path_out[i] = temp_path[path_len - 1 - i];
    }

    return path_len;
}

// EMSCRIPTEN exports (mock for illustration, if compiled with emcc)
#ifdef __EMSCRIPTEN__
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int c_calculate_route(int* edges_src, int* edges_dst, float* edges_weight, int edge_count, int num_nodes, int start_node, int end_node, int* path_out, float* dist_out) {
    Graph g;
    init_graph(&g, num_nodes);
    
    for (int i = 0; i < edge_count; i++) {
        add_edge(&g, edges_src[i], edges_dst[i], edges_weight[i]);
    }
    
    return find_shortest_path(&g, start_node, end_node, path_out, dist_out);
}
#endif
