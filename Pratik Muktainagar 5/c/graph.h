#ifndef GRAPH_H
#define GRAPH_H

#define MAX_NODES 100
#define INF 999999.0f

typedef struct {
    int target;
    float weight;
} Edge;

typedef struct {
    int id;
    Edge edges[MAX_NODES];
    int edge_count;
} Node;

typedef struct {
    Node nodes[MAX_NODES];
    int node_count;
} Graph;

void init_graph(Graph* g, int num_nodes);
void add_edge(Graph* g, int source, int target, float weight);
int find_shortest_path(Graph* g, int start_node, int end_node, int* path_out, float* distance_out);

#endif
