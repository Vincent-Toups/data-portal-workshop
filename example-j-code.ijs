load 'csv'
load 'plot'

data =: (readcsv './source_data/clinical_outcomes.csv')
NB. data =: readcsv './test.csv'

typeof =: (3!:0)

id =. monad define
y
)

column_index =: 4 : 0
  header =. {. x
  I. ((<y) = (|: header))
)

column =: 4 : 0
  ci =. x column_index y
  , ci { (|:  }. x)
)

is_char =. (=&2)@typeof

maybe_coerce =. id`". @. is_char

column_n =: 4 : 0
  
  , maybe_coerce@> x column y
)

columns =: ,@{. 


select =: 4 : 0
  desired =. y
  current =. {. x

  n_des =. 0 { $ , desired
  n_cur =. 0 { $ , current

  d_des =. |: (n_des, n_cur) $ n_cur # desired
  d_cur =. (n_cur, n_des) $ n_des # current

  ii =. I. 1 = ((+/)"(1) (d_des = d_cur))
  |: ii { |: x

)

add_column =: dyad define
  |: (y, (|: x))
)

group_by =: 4 : 0
  header =. {. x
  add_header =. header&,
  y <@add_header/. }. x
)

ungroup =: monad define
  header =. 0 { > 0 { y
  add_header =. header&,
  add_header (; (}.)&.> y)
)

nrow =: monad define
  (# data) - 1
) 

summarize =: 1 : 0
  (u&.>)
)

flip =: 1 : 0
     ] u [
)

subset =: data select ('id'; 'redcap_event_name'; 'bpi_intensity'; 'group')

subj_summary =: monad define
  c1 =. ('redcap_event_name'; 0 { y column 'redcap_event_name')
  c2 =. ('group';0 { y column 'group')
  c3 =. ('bpi_intensity'; (+/ % #) y column_n 'bpi_intensity')
  c1,.c2,.c3
)

group_avgs =: ungroup subj_summary summarize subset group_by <"1 (;"1 (data column 'group'),.(data column 'redcap_event_name'))

to_time_index =. monad define
 names =. ('baseline';'t2_arm_1';'1_month_follow_up_arm_1';'2_month_follow_up_arm_1';'3_month_follow_up_arm_1';'6_month_follow_up_arm_1';'12_month_follow_up_arm_1')
 indices =. 1 + i. 7
 (I. ((<y) = names)) { indices
)

group_avgs =: group_avgs add_column , ('time_index';<"0 to_time_index@> (group_avgs column 'redcap_event_name')) 

filter =: dyad define
  header =. {. x
  add_header =. header&,
  data =. }. x
  add_header (I. y) { data  
)

group_avgs_f =: group_avgs filter (0 ~: >"1 group_avgs column 'time_index')

plot_one_group =. dyad define
  data =. x filter (y = x column_n 'group')
  colors =. ('RED';'GREEN';'BLUE')
  pd 'type line'
  pd 'color ', > (y-1) { colors
  ti =. (data column_n 'time_index')
  pain =. (data column_n 'bpi_intensity')
  tii =. /: ti
  ti =. tii { ti
  pain =. tii { pain
  pd (ti;pain)
)

make_plot =: monad define
  data_set =. y 
  groups =.  (1,2,3)
  pd 'reset'
  (plot_one_group~&data_set)"0 groups
  pd 'show'
)

pd 'reset'
pd 'type line'
pd (((i. 10) { group_avgs_f column_n 'time_index');((i. 10) { group_avgs_f column_n 'bpi_intensity'))
pd 'show'

