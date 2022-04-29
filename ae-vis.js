const svg_element = d3.selectAll("#vis");
const numerical_columns = "id group pain_avg bpi_intensity bpi_interference odi promis_dep promis_anger promis_anxiety promis_sleep panas_pa panas_na pcs tsk11 sopa_emo pgic tx_satisfaction alcohol opioid cannabis AE1 AE2 cluster time demographic_cluster".split(" ");

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
          const tight_bounds = get_bounds(data, ["bpi_intensity", "bpi_interference"]);
          const x_bounds = widen_bounds(tight_bounds.bpi_intensity_min, tight_bounds.bpi_intensity_max, 0.1);
          const y_bounds = widen_bounds(tight_bounds.bpi_interference_min, tight_bounds.bpi_interference_max, 0.1);
          const label = d3.select("body").append("div");
          label.append("span").text("Month: ");
          label.append("span").attr("id","week").text("0");
          const vis = d3.select("#vis").attr("viewBox",[x_bounds[0], y_bounds[0],
                                                      x_bounds[1]-x_bounds[0],
                                                        y_bounds[1]-y_bounds[0]])
                .attr("width", 800)
                .attr("height", 800);
          const times = split_time(data);
          const time_keys = Object
                .keys(times)
                .map(x => +x)
                .filter(x => typeof x === "number")
                .sort((a,b) => a < b ? -1 : a > b ? 1 : 0);
          const idfun = row => row.id;
          const colors = ["yellow","red","green","blue"];
          
          vis.selectAll("circle").data(times[0],idfun)
              .join("circle")
              .attr("cx", d=>d.bpi_intensity)
              .attr("cy", d=>d.bpi_interference)
              .attr("r", 0.1)
              .attr("fill", row=>colors[row.group]);

          var i = 0;
          setInterval(_ => {
              i = (i + 1) % time_keys.length;
              vis.selectAll("circle").data(times[time_keys[i]],idfun)
                  .join("circle")
                  .transition()
                  .duration(300)
                  .attr("cx", d=>d.bpi_intensity)
                  .attr("cy", d=>d.bpi_interference)
                  .attr("r", 0.1)
                  .attr("fill", row=>colors[row.group]);
              label.select("#week").text(time_keys[i]);
          }, 300)
      });


