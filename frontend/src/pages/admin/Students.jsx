import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, UserPlus, Search, Users } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { Avatar, EmptyState, Skeleton } from "../../components/ui.jsx";

const EMPTY = { name:"", email:"", password:"", guardianName:"", school:"", grade:"", className:"" };

export default function Students() {
  const toast = useToast();
  const [students,setStudents]=useState([]);
  const [form,setForm]=useState(EMPTY);
  const [editing,setEditing]=useState(null);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function load(){
    setLoading(true);
    try { setStudents(await api.get("/api/admin/students")); }
    catch(err){ toast.show(err?.data?.message || "Failed to load students","error"); }
    finally { setLoading(false); }
  }
  useEffect(()=>{load();},[]);

  function startEdit(s){
    setEditing(s.studentId);
    setForm({name:s.name||"",email:s.email||"",password:"",guardianName:s.guardianName||"",school:s.school||"",grade:s.grade||"",className:s.className||""});
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function reset(){setEditing(null);setForm(EMPTY);}
  async function save(){
    if(!form.name||!form.email||!form.guardianName||!form.school||!form.grade||!form.className){toast.show("Please fill all required fields","error");return;}
    setSaving(true);
    try {
      if(editing) await api.put(`/api/admin/students/${editing}`,form);
      else await api.post("/api/admin/students",form);
      toast.show(editing ? "Student updated" : "Student created","success");
      reset(); await load();
    } catch(err){toast.show(err?.data?.message || "Save failed","error");}
    finally{setSaving(false);}
  }
  async function remove(id){
    if(!window.confirm("Delete this student? This cannot be undone.")) return;
    try { await api.del(`/api/admin/students/${id}`); toast.show("Student deleted","success"); await load(); }
    catch(err){toast.show(err?.data?.message || "Delete failed. Check related records.","error");}
  }
  const filtered=useMemo(()=>{
    const q=query.toLowerCase().trim();
    return !q?students:students.filter(s=>`${s.name} ${s.email} ${s.school} ${s.grade}`.toLowerCase().includes(q));
  },[students,query]);

  return <Layout title="Students" subtitle={`${students.length} students`}>
    <div className="adminCrudPage">
      <section className="card">
        <div className="between">
          <div><div className="h2"><UserPlus size={18} style={{verticalAlign:"-3px",marginRight:7}}/>{editing?"Edit student":"Add student"}</div><p className="subtitle">{editing?"Update the student account details.":"Create a student account from the admin panel."}</p></div>
          {editing && <button className="btn btn-outline" onClick={reset}>Cancel</button>}
        </div>
        <div className="crudForm">
          {[
            ["name","Full name",true],["email","Email",true],["password",editing?"New password (optional)":"Password",!editing],
            ["guardianName","Guardian name",true],["school","School",true],["grade","Grade",true],["className","Class",true]
          ].map(([k,l])=><div className="field" key={k}><label className="label">{l}</label><input className="input" type={k==="password"?"password":"text"} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>)}
        </div>
        <button className="btn" onClick={save} disabled={saving}>{saving?"Saving…":editing?"Save changes":"Create student"}</button>
      </section>

      <section className="card">
        <div className="between crudToolbar">
          <div className="h2" style={{marginBottom:0}}><Users size={18} style={{verticalAlign:"-3px",marginRight:7}}/>Student records</div>
          <div className="inputSearch"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search students…"/></div>
        </div>
        {loading ? <Skeleton height={300} radius={16}/> : filtered.length===0 ? <EmptyState icon={<Users size={22}/>} title="No students found" description="Create a student or change your search."/> :
          <div className="crudTableWrap"><table><thead><tr><th>Student</th><th>School</th><th>Grade / Class</th><th>Expiry</th><th>Actions</th></tr></thead><tbody>
            {filtered.map(s=><tr key={s.studentId}><td><div className="center-v"><Avatar name={s.name}/><div><strong>{s.name}</strong><div className="faint">{s.email}</div></div></div></td><td>{s.school}</td><td>{s.grade} · {s.className}</td><td>{s.tierExpDate||"—"}</td><td><div className="center-v"><button className="btn btn-outline btn-sm" onClick={()=>startEdit(s)}><Pencil size={13}/>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>remove(s.studentId)}><Trash2 size={13}/>Delete</button></div></td></tr>)}
          </tbody></table></div>}
      </section>
    </div>
  </Layout>;
}
