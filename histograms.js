import * as d3 from "https://cdn.skypack.dev/d3@7";

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

const svg_element = d3.selectAll("#vis");
const numerical_columns = "id group pain_avg bpi_intensity bpi_interference odi promis_dep promis_anger promis_anxiety promis_sleep panas_pa panas_na pcs tsk11 sopa_emo pgic tx_satisfaction alcohol opioid cannabis AE1 AE2 cluster time".split(" ");

const get_bounds = (data, cols) => {
    var out = {};
    cols.forEach(col => {
        out[col+"_min"] = Infinity;
        out[col+"_max"] = -Infinity;
    })
    data.forEach(row=>{
        cols.forEach(col => {
            const v = row[col];
            out[col+"_min"] = v < out[col+"_min"] ? v : out[col+"_min"];
            out[col+"_max"] = v > out[col+"_max"] ? v : out[col+"_max"];
        });
    });
    return out;
}

const widen_bounds = (mn, mx, by) => {
    const w = mx-mn;
    const pad = (w*by)/2;
    return [mn-pad, mx+pad];
}

const split_time = data => {
    const out = [];
    data.forEach(row => {
        const t = row.time - 1;
        var set = out[t];
        if(set === undefined){
            set = [];
        }
        set.push(row);
        out[t] = set;
    });
    return out;
}

d3.csv("derived_data/clinical_outcomes-d3.csv",
      function(row){
        numerical_columns.forEach(c => row[c] = +row[c]);
        return row;
      }).then(data => {
          const tight_bounds = get_bounds(data, ["AE1", "AE2"]);
          const x_bounds = widen_bounds(tight_bounds.AE1_min, tight_bounds.AE1_max, 0.1);
          const y_bounds = widen_bounds(tight_bounds.AE2_min, tight_bounds.AE2_max, 0.1);
          const vis = d3.select("#vis").attr("viewBox",[x_bounds[0], y_bounds[0],
                                                      x_bounds[1]-x_bounds[0],
                                                        y_bounds[1]-y_bounds[0]])
                .attr("width", 800)
                .attr("height", 800);
          const times = split_time(data);
          const idfun = row => row.id;
          const colors = ["yellow","red","green","blue"];
          
          vis.selectAll("circle").data(times[0],idfun)
              .join("circle")
              .attr("cx", d=>d.AE1)
              .attr("cy", d=>d.AE2)
              .attr("r", 0.01)
              .attr("fill", row=>colors[row.group]);

          var i = 0;
          setInterval(_ => {
              i = (i + 1) % 7;
              vis.selectAll("circle").data(times[i],idfun)
                  .join("circle")
                  .transition()
                  .duration(2000)
                  .attr("cx", d=>d.AE1)
                  .attr("cy", d=>d.AE2)
                  .attr("r", 0.01)
                  .attr("fill", row=>colors[row.group]);
          }, 2000)
      });


